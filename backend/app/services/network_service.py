"""
NetworkX Graph Topology and Mule Network Analysis Service for MuleNet AI (PS-01).
Builds directed graph topology directly from processed transaction records,
computes PageRank, identifies money mule topologies (Star, Chain, Fan-out, Fan-in),
and supports neighborhood subgraph exploration.
"""

import networkx as nx
import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Set

from app.services.transaction_service import get_current_transactions, extract_account_indicators
from app.services.ml_service import predict_account

logger = logging.getLogger(__name__)

def generate_mule_network_graph(
    center_account: Optional[str] = None,
    max_nodes: int = 60,
    neighborhood_depth: int = 1,
    depth: Optional[int] = None
) -> Dict[str, Any]:
    """
    Constructs an interactive account relationship graph from actual processed transaction data.
    If center_account is provided, extracts the k-hop ego network around that account.
    """
    if depth is not None:
        neighborhood_depth = depth
    txns = get_current_transactions()
    
    # Build complete directed graph from real transactions
    G = nx.DiGraph()
    edge_data_map: Dict[tuple, Dict[str, Any]] = {}

    for t in txns:
        u = str(t.get("sender_account", "")).strip()
        v = str(t.get("receiver_account", "")).strip()
        amt = float(t.get("amount", 0.0))
        tid = t.get("transaction_id", "")
        ts = t.get("timestamp", "")
        ch = t.get("channel", "UPI")

        if not u or not v:
            continue

        pair = (u, v)
        if pair not in edge_data_map:
            edge_data_map[pair] = {
                "source": u,
                "target": v,
                "amount": 0.0,
                "transactions": 0,
                "channel": ch,
                "last_date": ts,
                "transaction_ids": []
            }
        
        edge_data_map[pair]["amount"] += amt
        edge_data_map[pair]["transactions"] += 1
        edge_data_map[pair]["transaction_ids"].append(tid)
        if ts > edge_data_map[pair]["last_date"]:
            edge_data_map[pair]["last_date"] = ts

    for (u, v), e_info in edge_data_map.items():
        G.add_edge(u, v, **e_info)

    # Subgraph filtering if center_account requested
    if center_account and center_account in G:
        sub_nodes = {center_account}
        current_layer = {center_account}
        
        for _ in range(neighborhood_depth):
            next_layer = set()
            for n in current_layer:
                next_layer.update(G.predecessors(n))
                next_layer.update(G.successors(n))
            sub_nodes.update(next_layer)
            current_layer = next_layer
            
        G = G.subgraph(list(sub_nodes)[:max_nodes]).copy()
    elif len(G.nodes) > max_nodes:
        # Prioritize suspicious accounts and their direct neighbors
        degrees = dict(G.degree())
        top_nodes = sorted(degrees.keys(), key=lambda n: degrees[n], reverse=True)[:max_nodes]
        G = G.subgraph(top_nodes).copy()

    node_ids = list(G.nodes)
    if not node_ids:
        return {
            "nodes": [],
            "edges": [],
            "clusters": [],
            "total_nodes": 0,
            "total_edges": 0,
            "mule_nodes_count": 0,
            "network_volume": 0.0
        }

    # Score each node in the graph using Drishthi predict_account
    node_details = {}
    for nid in node_ids:
        try:
            res = predict_account(nid, mode="full_feature")
            if res.get("found"):
                r_score = res["risk_score"]
                r_lvl = res["risk_level"]
                m_prob = res.get("model_probability", 0.0)
            else:
                r_score = 15.0
                r_lvl = "LOW"
                m_prob = 0.15
        except Exception:
            r_score = 15.0
            r_lvl = "LOW"
            m_prob = 0.15

        indicators = extract_account_indicators(nid, txns)
        
        node_details[nid] = {
            "risk_score": r_score,
            "risk_level": r_lvl,
            "probability": m_prob,
            "is_mule": r_score >= 50.0,
            "incoming_volume": indicators["total_incoming_amount"],
            "outgoing_volume": indicators["total_outgoing_amount"],
            "indicators": indicators["indicators"]
        }

    # Compute NetworkX metrics
    try:
        pagerank = nx.pagerank(G, alpha=0.85, max_iter=100)
    except Exception:
        pagerank = {n: round(1.0 / len(node_ids), 4) for n in node_ids}

    # Identify Connected Components (Clusters)
    weak_comps = list(nx.weakly_connected_components(G))
    cluster_map = {}
    clusters_data = []

    for c_idx, comp in enumerate(weak_comps):
        comp_nodes = list(comp)
        cluster_id = f"CLUSTER-{c_idx + 1}"
        for n in comp_nodes:
            cluster_map[n] = cluster_id

        comp_scores = [node_details[n]["risk_score"] for n in comp_nodes if n in node_details]
        comp_mules = sum(1 for n in comp_nodes if node_details.get(n, {}).get("is_mule", False))
        comp_vol = sum(G[u][v]["amount"] for u, v in G.edges if u in comp and v in comp)

        clusters_data.append({
            "cluster_id": cluster_id,
            "node_count": len(comp_nodes),
            "mule_count": comp_mules,
            "avg_risk_score": round(float(np.mean(comp_scores)), 1) if comp_scores else 0.0,
            "total_flow_amount": round(comp_vol, 2),
            "member_accounts": comp_nodes[:8]
        })

    # Build node list for frontend D3 / Canvas visualizer
    nodes_out = []
    for nid in node_ids:
        in_deg = G.in_degree(nid)
        out_deg = G.out_degree(nid)
        n_info = node_details.get(nid, {"risk_score": 10.0, "risk_level": "LOW", "is_mule": False})

        # Topology classification
        if in_deg >= 3 and out_deg <= 1:
            topo = "STAR / FAN-IN"
            topo_desc = "Funnel collector account receiving transfers from multiple feeder accounts."
        elif out_deg >= 3 and in_deg <= 1:
            topo = "FAN-OUT DISPERSION"
            topo_desc = "Disbursement hub distributing funds to multiple destination payees."
        elif in_deg >= 1 and out_deg >= 1:
            topo = "CHAIN TRANSIT"
            topo_desc = "Layering transit intermediary forwarding incoming funds across chain links."
        else:
            topo = "ENDPOINT"
            topo_desc = "Terminal transacting counterparty."

        nodes_out.append({
            "id": nid,
            "label": nid,
            "risk_score": n_info["risk_score"],
            "risk_level": n_info["risk_level"],
            "is_mule": n_info["is_mule"],
            "probability": n_info.get("probability", 0.0),
            "in_degree": in_deg,
            "out_degree": out_deg,
            "connected_accounts_count": in_deg + out_deg,
            "pagerank": round(float(pagerank.get(nid, 0.0)), 4),
            "incoming_amount": round(n_info.get("incoming_volume", 0.0), 2),
            "outgoing_amount": round(n_info.get("outgoing_volume", 0.0), 2),
            "cluster_id": cluster_map.get(nid, "CLUSTER-1"),
            "primary_topology": topo,
            "topology_explanation": topo_desc,
            "indicators": n_info.get("indicators", [])
        })

    # Build edges list
    edges_out = []
    total_net_vol = 0.0
    for u, v, d in G.edges(data=True):
        amt = round(float(d.get("amount", 0.0)), 2)
        total_net_vol += amt
        
        # Classify edge pattern
        if G.in_degree(v) >= 3:
            pattern = "FAN-IN"
        elif G.out_degree(u) >= 3:
            pattern = "FAN-OUT"
        elif G.in_degree(u) >= 1 and G.out_degree(v) >= 1:
            pattern = "CHAIN"
        else:
            pattern = "STANDARD"

        edges_out.append({
            "source": u,
            "target": v,
            "amount": amt,
            "transactions": d.get("transactions", 1),
            "channel": d.get("channel", "UPI"),
            "last_date": d.get("last_date", datetime.now().strftime("%Y-%m-%d %H:%M")),
            "transaction_ids": d.get("transaction_ids", []),
            "pattern": pattern
        })

    mules_count = sum(1 for n in nodes_out if n["is_mule"])

    return {
        "nodes": nodes_out,
        "edges": edges_out,
        "clusters": clusters_data,
        "total_nodes": len(nodes_out),
        "total_edges": len(edges_out),
        "mule_nodes_count": mules_count,
        "network_volume": round(total_net_vol, 2),
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
