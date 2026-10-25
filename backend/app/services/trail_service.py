"""
Money-Trail Analysis Service for MuleNet AI (Cyber Hackathon 2026 PS-01).
Utilizes NetworkX directed graph algorithms with temporal consistency constraints
to trace multi-hop fund flows, detect intermediary transit accounts, and analyze layering paths.
"""

import networkx as nx
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from app.services.transaction_service import get_current_transactions

logger = logging.getLogger(__name__)

def build_transaction_graph(txns: Optional[List[Dict[str, Any]]] = None) -> nx.DiGraph:
    """Builds a directed multi-edge graph from transaction records."""
    if txns is None:
        txns = get_current_transactions()

    G = nx.DiGraph()
    for t in txns:
        src = str(t.get("sender_account", "")).strip()
        dst = str(t.get("receiver_account", "")).strip()
        if not src or not dst:
            continue

        if not G.has_edge(src, dst):
            G.add_edge(src, dst, transactions=[])
        
        G[src][dst]["transactions"].append({
            "transaction_id": t.get("transaction_id", ""),
            "amount": float(t.get("amount", 0.0)),
            "timestamp": t.get("timestamp", ""),
            "channel": t.get("channel", "UPI"),
            "notes": t.get("notes", "")
        })
    return G

def find_money_trails(
    source_account: str,
    destination_account: str,
    max_depth: int = 4
) -> Dict[str, Any]:
    """
    Finds multi-hop money trails between source and destination accounts.
    Enforces temporal consistency: each subsequent hop must occur chronologically after the previous hop.
    Identifies intermediary accounts and calculates transit latencies.
    """
    txns = get_current_transactions()
    G = build_transaction_graph(txns)

    src = source_account.strip()
    dst = destination_account.strip()

    if not G.has_node(src):
        return {
            "source_account": src,
            "destination_account": dst,
            "paths_found": 0,
            "paths": [],
            "message": f"Source account '{src}' has no recorded outbound transactions in the active dataset."
        }

    if not G.has_node(dst):
        return {
            "source_account": src,
            "destination_account": dst,
            "paths_found": 0,
            "paths": [],
            "message": f"Destination account '{dst}' has no recorded inbound transactions in the active dataset."
        }

    try:
        raw_paths = list(nx.all_simple_paths(G, source=src, target=dst, cutoff=max_depth))
    except Exception as e:
        logger.error(f"Error finding paths: {str(e)}")
        raw_paths = []

    valid_trails = []

    for path_nodes in raw_paths:
        # Collect edge transactions for this node sequence
        hops = []
        is_chronological = True
        prev_time = None
        total_path_amount = 0.0

        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i+1]
            edge_txns = G[u][v].get("transactions", [])
            if not edge_txns:
                is_chronological = False
                break

            # Find transaction that occurred after prev_time (or the latest available)
            sorted_edge_txns = sorted(edge_txns, key=lambda x: x["timestamp"])
            chosen_txn = None

            if prev_time is None:
                chosen_txn = sorted_edge_txns[0]
            else:
                # Look for subsequent transaction
                candidates = [t for t in sorted_edge_txns if t["timestamp"] >= prev_time]
                if candidates:
                    chosen_txn = candidates[0]
                else:
                    chosen_txn = sorted_edge_txns[0]
                    # Note temporal inversion if applicable
                    is_chronological = False

            try:
                curr_time = datetime.strptime(chosen_txn["timestamp"], "%Y-%m-%d %H:%M:%S")
            except Exception:
                curr_time = None

            latency_mins = None
            if prev_time is not None and curr_time is not None:
                try:
                    p_dt = datetime.strptime(prev_time, "%Y-%m-%d %H:%M:%S")
                    latency_mins = round((curr_time - p_dt).total_seconds() / 60.0, 1)
                except Exception:
                    latency_mins = None

            hops.append({
                "hop_number": i + 1,
                "from_account": u,
                "to_account": v,
                "transaction_id": chosen_txn["transaction_id"],
                "amount": chosen_txn["amount"],
                "timestamp": chosen_txn["timestamp"],
                "channel": chosen_txn["channel"],
                "latency_minutes_from_prev_hop": latency_mins,
                "notes": chosen_txn.get("notes", "")
            })

            total_path_amount = max(total_path_amount, chosen_txn["amount"])
            prev_time = chosen_txn["timestamp"]

        intermediary_nodes = path_nodes[1:-1]
        
        # Calculate total transit duration
        transit_duration_mins = None
        if hops and len(hops) > 1:
            try:
                t_start = datetime.strptime(hops[0]["timestamp"], "%Y-%m-%d %H:%M:%S")
                t_end = datetime.strptime(hops[-1]["timestamp"], "%Y-%m-%d %H:%M:%S")
                transit_duration_mins = round((t_end - t_start).total_seconds() / 60.0, 1)
            except Exception:
                transit_duration_mins = None

        valid_trails.append({
            "path_id": f"TRAIL-{'->'.join(path_nodes)}",
            "hop_count": len(hops),
            "account_sequence": path_nodes,
            "intermediary_accounts": intermediary_nodes,
            "intermediary_count": len(intermediary_nodes),
            "is_temporally_consistent": is_chronological,
            "total_transit_duration_minutes": transit_duration_mins,
            "hops": hops
        })

    # Sort valid trails by hop count (shortest first) and temporal consistency
    valid_trails = sorted(valid_trails, key=lambda x: (not x["is_temporally_consistent"], x["hop_count"]))

    return {
        "source_account": src,
        "destination_account": dst,
        "max_depth_queried": max_depth,
        "paths_found": len(valid_trails),
        "paths": valid_trails,
        "message": f"Successfully identified {len(valid_trails)} money-trail path(s) connecting {src} and {dst}." if valid_trails else f"No qualifying transaction path found between {src} and {dst} within {max_depth} hops.",
        "disclaimer": "Money-trail analysis identifies transaction connectivity and temporal fund transit correlation. Findings serve as investigative leads and do not constitute legal proof of financial crime."
    }
