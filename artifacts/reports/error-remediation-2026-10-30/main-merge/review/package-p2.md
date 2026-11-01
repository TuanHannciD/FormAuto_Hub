# P2 — mirror package không khớp trên Git checkout sạch

Reviewer `/root/main_merge_review`, `gpt-6.1-sol/high`, 2026-11-01. Snapshot `8a4f18ee77453857c550ff7be0279c5cc9e415f1..3893d0c660890c94f32ebb432c79373f6fe091f7`.

**Confirmed P2, prerequisite `be3c65b`.** `.agents/skills/formauto-server-debugger/agents/openai.yaml:1` có Git blob `10cdfc20add765ccbde942fe5cda7d29696921cd`, 232 bytes LF, SHA256 `0f10c2f4f2c5b3ac18b5c5065abc0a15d014f512704d4ad59e89ab94654981af`. Mirror `.claude/skills/formauto-server-debugger/agents/openai.yaml:1` có blob `48529b5627caac51ee7c50fd6e8ec995b5a82656`, 236 bytes CRLF, SHA256 `0b6a53013fd19b0b41ca7521961162dfdc1d050e0fba006e2bd1adad89a42fb4`.

Commit thêm `.gitattributes` với `-text` cho cả hai cây nhưng không thống nhất file specialist có trước với mirror mới. Trigger: checkout candidate sạch rồi `python scripts/agent-skills.py --check`. Checker so `read_bytes()` tại `scripts/agent-skills.py:96`, nên package maintenance gate báo `Mirror drift in 1 files; inspect, then run --sync if authorized`. Nội dung YAML đồng nghĩa sau normalize LF, không có product/API regression; byte-identical mirror là requirement của package này.

Đã kiểm Git blobs đủ293 mirror entries: duy nhất path này khác. Đủ280 manifest-owned vendor hashes match exact candidate bytes; không sửa vendor để làm xanh. Reproduction `mirror-reproduction-result.json` dùng chính checker candidate, exact hai Git blobs trong artifact fixture và known-file source mapping; kết quả expected failure. Đây là kiểm riêng mirror logic, không giả là full clean-export checker. Root/runtime owner có thể kiểm full Git export độc lập.

Local raw hai file hiện bằng nhau do lịch sử checkout/index EOL; local checker còn fail sớm vì ba ignored `ui-ux-pro-max/scripts/__pycache__/*.pyc`. Bytecode local không tracked nên không gán thành candidate defect, không xóa để làm xanh. Git content là bằng chứng cho finding chính.

Smallest fix: giữ source canonical LF đã committed, ghi cả hai source/mirror đúng canonical bytes, exact stage hai paths và xác minh Git index/candidate blobs cùng `10cdfc20...`; không sửa YAML text, global config, vendor pin hay cleanup pycache. Fresh independent review staged delta + full clean Git-export checker trước commit/push/merge. Root quyết định mutation; reviewer chỉ ghi artifacts.
