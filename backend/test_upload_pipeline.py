import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)
    
    print("=" * 60)
    print("TESTING CSV UPLOAD ENDPOINT VALIDATION & ERROR HANDLING")
    print("=" * 60)

    # Baseline: Check current dataset summary
    r_init = client.get("/api/dataset/summary")
    assert r_init.status_code == 200
    init_summary = r_init.json()
    print(f"\n[INIT] Active dataset: {init_summary.get('filename')} | Rows: {init_summary.get('rows')} | Target: {init_summary.get('target_found')}")

    # Test 1: Upload without file
    print("\n[TEST 1] Upload without file:")
    r = client.post("/api/dataset/upload")
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response: {data}")
    assert data["status"] == "error"
    assert "No file was uploaded" in data["message"]

    # Test 2: Upload empty CSV (0 bytes)
    print("\n[TEST 2] Upload empty CSV (0 bytes):")
    r = client.post("/api/dataset/upload", files={"file": ("empty.csv", b"", "text/csv")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response: {data}")
    assert data["status"] == "error"
    assert "empty" in data["message"].lower()

    # Test 3: Upload non-csv file
    print("\n[TEST 3] Upload non-CSV file (.txt):")
    r = client.post("/api/dataset/upload", files={"file": ("data.txt", b"hello world", "text/plain")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response: {data}")
    assert data["status"] == "error"
    assert "Only CSV (.csv) files are supported" in data["message"]

    # Test 4: Upload malformed CSV
    print("\n[TEST 4] Upload malformed CSV (token error):")
    bad_csv = b"colA,colB,colC\n1,2\n3,4,5,6,7\n"
    r = client.post("/api/dataset/upload", files={"file": ("malformed.csv", bad_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response: {data}")
    assert data["status"] == "error"

    # Test 5: Upload CSV missing target column F3924
    print("\n[TEST 5] Upload feature matrix missing target column F3924:")
    no_target_csv = (
        "ACCOUNT_ID,F115,F321,F527,F531\n" +
        "\n".join([f"ACC-{100+i},2.5,3.1,4.2,5.0" for i in range(20)])
    ).encode()
    r = client.post("/api/dataset/upload", files={"file": ("no_target.csv", no_target_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response message: {data.get('message')}")
    assert data["status"] == "error"
    assert "F3924" in data["message"]

    # Test 6: Verify previous dataset is retained after failures
    r_check = client.get("/api/dataset/summary")
    summary_after_fail = r_check.json()
    print(f"\n[VERIFY STATE RETENTION] Dataset after failed uploads: {summary_after_fail.get('filename')} (Should match initial)")
    assert summary_after_fail.get("filename") == init_summary.get("filename")

    # Test 7: Upload CSV with invalid/non-binary target labels
    print("\n[TEST 7] Upload CSV with invalid target values (e.g. 5, 'unknown'):")
    invalid_labels_csv = (
        "ACCOUNT_ID,F115,F321,F3924\n" +
        "\n".join([f"ACC-{100+i},2.5,3.1,{i % 3}" for i in range(20)]) # 0, 1, 2
    ).encode()
    r = client.post("/api/dataset/upload", files={"file": ("invalid_labels.csv", invalid_labels_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response message: {data.get('message')}")
    assert "non-binary" in data["message"].lower() or "invalid" in data["message"].lower()

    # Test 8: Upload CSV with insufficient class balance (<5 samples)
    print("\n[TEST 8] Upload CSV with insufficient class balance (only 1 mule):")
    imbalanced_csv = (
        "ACCOUNT_ID,F115,F321,F3924\n" +
        "\n".join([f"ACC-{100+i},2.5,3.1,{1 if i == 0 else 0}" for i in range(15)])
    ).encode()
    r = client.post("/api/dataset/upload", files={"file": ("imbalanced.csv", imbalanced_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 400)")
    assert r.status_code == 400
    data = r.json()
    print(f"Response message: {data.get('message')}")
    assert "5-Fold" in data["message"] or "5" in data["message"]

    # Test 9: Upload Valid Feature Matrix CSV with target F3924
    print("\n[TEST 9] Upload Valid Feature Matrix CSV with F3924 (20 rows, 14 legit, 6 mules):")
    valid_csv_lines = ["ACCOUNT_ID,F115,F321,F527,F531,F670,F1692,F2082,F2582,F2678,F2737,F3836,F3887,F3889,F3891,F3894,F1,F2,F3924"]
    for i in range(20):
        is_mule = 1 if i in [3, 7, 11, 14, 18, 19] else 0
        valid_csv_lines.append(f"ACC-CUSTOM-{1000+i},2.5,3.1,4.0,5.0,12.0,6.0,7.0,15000,35000,28000,1200,45,2,3,25,10.0,5.0,{is_mule}")
    valid_csv = "\n".join(valid_csv_lines).encode()

    r = client.post("/api/dataset/upload", files={"file": ("valid_training_dataset.csv", valid_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 200)")
    assert r.status_code == 200
    data = r.json()
    print(f"Success message: {data.get('message')}")
    print(f"Model retrained: {data.get('model_retrained')} | Training msg: {data.get('model_training_message')}")
    print(f"Metadata rows: {data.get('metadata', {}).get('rows')} | Suspicious: {data.get('metadata', {}).get('suspicious_count')} | Legitimate: {data.get('metadata', {}).get('legitimate_count')}")
    assert data["status"] == "success"
    assert data["metadata"]["rows"] == 20
    assert data["metadata"]["suspicious_count"] == 6
    assert data["metadata"]["legitimate_count"] == 14
    assert data["metadata"]["target_found"] is True

    # Test 10: Upload Valid Transaction Ledger CSV
    print("\n[TEST 10] Upload Valid Transaction Ledger CSV:")
    txn_lines = ["transaction_id,sender_account,receiver_account,amount,timestamp,channel,status"]
    for i in range(15):
        txn_lines.append(f"TXN-CUSTOM-{i+1:04d},ACC-TXN-{100+(i%5)},ACC-TXN-{200+(i%4)},{500.0 * (i+1)},2026-08-20 12:00:00,UPI,COMPLETED")
    txn_csv = "\n".join(txn_lines).encode()

    r = client.post("/api/dataset/upload", files={"file": ("custom_transactions.csv", txn_csv, "text/csv")})
    print(f"Status: {r.status_code} (Expected 200)")
    assert r.status_code == 200
    data = r.json()
    print(f"Success message: {data.get('message')}")
    assert data["status"] == "success"
    assert data["metadata"]["total_transactions"] == 15

    print("\n" + "=" * 60)
    print("ALL 10 UPLOAD ENDPOINT VALIDATION TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
