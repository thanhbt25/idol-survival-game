# Idol Survival: Sunny Debut 🌟

**Idol Survival: Sunny Debut** là một tựa game sinh tồn / mô phỏng quản lý thần tượng trên nền tảng web với đồ họa Pixel-art. Người chơi sẽ vào vai một thực tập sinh (Trainee), trải qua 30 ngày tập luyện khắc nghiệt, xây dựng các mối quan hệ và biểu diễn trên sân khấu để giành được suất "Debut" trong nhóm nhạc cuối cùng.

---

## 🎮 HƯỚNG DẪN CÁCH CHƠI (HOW TO PLAY)

Mục tiêu của bạn là sống sót qua các đợt loại trừ (Elimination) vào ngày 7, 14, 21 và lọt vào TOP 7 để Debut vào ngày 30.

1. **Tạo nhân vật (Character Creation):**
   - Tùy chỉnh tên và ngoại hình (Màu da, tóc, áo).
   - Phân bổ 100 điểm khởi đầu vào các chỉ số: Vocal, Dance, Rap, Visual, Charisma.

2. **Ký túc xá (Dorm / Hub):**
   - **Di chuyển:** Sử dụng các phím mũi tên `Lên`, `Xuống`, `Trái`, `Phải`.
   - **Tương tác NPC:** Đi lại gần chạm vào các NPC để nói chuyện, chọn câu trả lời đúng để tăng điểm quan hệ (Relationship) và điểm làm việc nhóm (Teamwork).
   - **Các phòng chức năng:** Đi vào các khu vực màu sắc để mở menu.
     - `VOCAL`, `DANCE`, `RAP`, `GYM`: Nhấn "PRACTICE" để tốn 10 Stamina và chơi Minigame tăng chỉ số.
     - `DORM`: Nhấn "SLEEP" để qua ngày và hồi phục toàn bộ Stamina.

3. **Tập luyện (Minigames):**
   - **Vocal:** Click chuột để giữ chim bay qua các khe ống (giống Flappy Bird).
   - **Dance:** Ghi nhớ thứ tự nút sáng và lặp lại bằng các phím `D`, `F`, `J`, `K`.
   - **Rap:** Gõ lại các từ xuất hiện trên màn hình vào ô input trước khi hết giờ.
   - **Gym:** Nhấn phím `Space` đúng lúc thanh trượt chạy vào vùng màu xanh.

4. **Ngày biểu diễn (Stage Day):**
   - Diễn ra định kỳ vào các ngày loại trừ.
   - Tải lên một file âm thanh (MP3) từ máy tính của bạn.
   - Chọn Concept (Vocal/Dance/Rap) và Độ khó (Easy/Med/Hard).
   - Chơi game nhịp điệu (Rhythm Game) bằng các phím `D`, `F`, `J`, `K` rơi theo nhịp độ bài hát. Nhấn giữ đối với các Note dài (Hold Notes).

5. **Xếp hạng & Bị loại:**
   - Điểm bình chọn (Votes) được tính dựa trên chỉ số của bạn, số lượng Fans thu thập được, và điểm quan hệ với NPC.
   - Tránh việc tụt xuống nhóm cuối bảng để không bị loại!

---

## 📁 CẤU TRÚC THƯ MỤC VÀ CHI TIẾT CÁC FILE

Dự án được chia nhỏ thành các module để dễ dàng quản lý và bảo trì.

### 1. `index.html`
- **Nhiệm vụ:** Là bộ khung giao diện của toàn bộ game.
- **Chi tiết:** Chứa các thẻ `div` phân chia các màn hình (screens) như: Title Screen, Create Screen, Hub Screen, Stage Screen, Result Screen, v.v. Nó cũng import file CSS và tất cả các file JS cần thiết.

### 2. `style.css`
- **Nhiệm vụ:** Quy định giao diện, màu sắc, bố cục và hiệu ứng.
- **Chi tiết:** Sử dụng CSS Variables (`:root`) để đồng bộ màu sắc. Định dạng phong cách Pixel-art, xử lý các hiệu ứng hover nút bấm, layout dạng lưới (Grid) cho danh sách NPC, và các hiệu ứng trượt/hiển thị thông báo (Toast).

### 3. `js/config.js`
- **Nhiệm vụ:** Chứa các biến cấu hình toàn cục và các hàm tiện ích dùng chung.
- **Biến / Hàm chính:**
  - `C`, `App`, `Player`, `NPCs`, `DECOR`: Khai báo các object lưu trữ dữ liệu trạng thái hiện tại của game.
  - `formatNum(n)`: Rút gọn số lớn (VD: 1000 -> 1k, 1000000 -> 1M).
  - `r(m)`: Hàm tạo số ngẫu nhiên tiện lợi.
  - `Notify.show(msg)`: Hệ thống hiển thị thông báo góc trên màn hình tự động biến mất sau vài giây.
  - `showScreen(id)`: Hàm xử lý việc ẩn/hiện các màn hình giao diện khác nhau.
  - `updateUI()`: Cập nhật các chỉ số (Stats, Fan, Day...) lên bảng HUD của người chơi.

### 4. `js/data.js`
- **Nhiệm vụ:** Lưu trữ các dữ liệu tĩnh (Static Data).
- **Biến / Hàm chính:**
  - `ROOMS`: Tọa độ và màu sắc các căn phòng trong ký túc xá.
  - `PALETTES`: Bảng màu da, tóc, quần áo cho chức năng tạo nhân vật.
  - `DECOR_TYPES`: Danh sách các loại vật thể trang trí (Cây, Chậu hoa, Cột đèn...).
  - `DIALOGUE_LIB`: Thư viện các câu hội thoại và lựa chọn trả lời khi tương tác với NPC.
  - `RelManager`: Khởi tạo fallback cho hệ thống quản lý điểm Quan hệ (Relationship).

### 5. `js/audio.js`
- **Nhiệm vụ:** Hệ thống âm thanh, tạo nhạc nền 8-bit bằng Web Audio API.
- **Biến / Hàm chính (`BGM` Object):**
  - `BGM.toggle()`: Bật / Tắt nhạc nền.
  - `BGM.play(type)`: Tạo dao động sóng âm (Oscillator) để phát đoạn nhạc `hub` (nhẹ nhàng) hoặc `minigame` (dồn dập) mà không cần file mp3 bên ngoài.
  - `BGM.stop()`: Dừng phát nhạc.

### 6. `js/map.js`
- **Nhiệm vụ:** Điều khiển bản đồ di chuyển 2D (Hub/Dorm).
- **Biến / Hàm chính (`HubMap` Object):**
  - `start()`, `stop()`: Khởi động hoặc dừng vòng lặp của bản đồ.
  - `loop()`: Vòng lặp chính (requestAnimationFrame), xử lý logic di chuyển bằng phím mũi tên, giới hạn camera, tính toán va chạm với cửa phòng và NPC.
  - `drawSprite(ctx, x, y, char)`: Render vẽ nhân vật pixel (Player & NPC) lên canvas.
  - `drawDecor(ctx)`: Render bóng đổ và các chi tiết trang trí (Cây, đèn, bụi cỏ).
  - `triggerRoom(room)`, `cancelRoom()`: Xử lý hiển thị popup khi nhân vật đứng trong khu vực phòng chức năng.

### 7. `js/minigame.js`
- **Nhiệm vụ:** Chứa logic và giao diện của 4 bài tập luyện.
- **Biến / Hàm chính (`Minigame` Object):**
  - `getDifficulty(statType)`: Tính toán độ khó linh hoạt dựa trên chỉ số hiện tại của người chơi.
  - `start(type)`, `finish(win, gain)`, `exit()`, `retry()`: Quản lý vòng đời mở/đóng/thắng/thua của minigame.
  - `vocal(c, params)`: Logic game Flappy bird.
  - `dance(c, params)`: Logic game trí nhớ nhấp nháy đèn.
  - `rap(c, params)`: Logic game gõ phím theo từ vựng.
  - `gym(c, params)`: Logic game canh thanh trượt (slider).

### 8. `js/stage.js`
- **Nhiệm vụ:** Quản lý phần chơi quan trọng nhất: Rhythm Game (Game nhịp điệu) và hiệu ứng kết thúc.
- **Biến / Hàm chính (`Stage` Object):**
  - `realInit()`: Khởi tạo Web Audio API để phân tích tần số bài hát MP3 do người dùng tải lên, gán tốc độ và tỷ lệ xuất hiện Note.
  - `loop()`: Vòng lặp phân tích âm thanh, sinh ra Tap Note và Hold Note, vẽ Note rơi xuống.
  - `handleInput(idx)`, `handleRelease(idx)`: Xử lý khi người dùng nhấn/nhả các phím `D, F, J, K`.
  - `evaluateHit(y, target)`, `triggerHit(type)`: Tính toán sai số để cho điểm PERFECT, GOOD, BAD, MISS và tính combo.
  - `endSong(winStatus)`: Tính tổng điểm lý thuyết (Accuracy), cộng điểm Bonus dựa trên chỉ số và hiển thị bảng điểm chi tiết.
  - `Fireworks` Object: Vẽ canvas hiệu ứng pháo hoa ăn mừng khi người chơi chiến thắng (Lọt top Debut).

### 9. `js/game.js`
- **Nhiệm vụ:** Controller trung tâm, kết nối các module lại với nhau, quản lý luồng thời gian và trạng thái game.
- **Biến / Hàm chính:**
  - `initGame()`, `generateDecor()`, `generateNPCs()`: Khởi tạo dữ liệu ngẫu nhiên khi mới load trang.
  - `Game.startCreation()`, `Game.finishCreation()`: Xử lý logic cộng trừ điểm lúc tạo nhân vật.
  - `Game.enterHub()`, `Game.checkStageDay()`, `Game.nextDay()`: Chuyển ngày và kiểm tra xem có đến ngày sự kiện (Elimination) hay không.
  - `Game.handleSongUpload()`, `Game.triggerTeamSelection()`, `Game.selectDiff()`: Xử lý logic ở màn hình phòng đợi biểu diễn.
  - `Game.finishStageDay()`, `Game.simDay()`: Tính toán lại điểm số Vote, Buff/Nerf tự động cho NPC và người chơi sau mỗi ngày.
  - `Game.renderRank()`: Vẽ bảng xếp hạng, bôi đỏ người bị loại, bôi vàng người được Debut.
  - `Game.triggerInteraction()`: Hiện khung hội thoại khi đụng vào NPC, trừ/cộng fan và quan hệ dựa trên lựa chọn.
  - `Game.showGameOver()`, `Game.showWin()`: Gọi màn hình tương ứng dựa trên kết quả sống sót của người chơi.
  - `Game.toggleSettings()`, `Game.quitToTitle()`: Quản lý nút Pause game và reset tiến trình chơi.