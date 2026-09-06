# Hướng Dẫn Thiết Kế Giao Diện Breek Premium (UI Guide)

Tài liệu này là **nguồn chân lý duy nhất (Single Source of Truth)** cho phong cách thẩm mỹ "Breek Premium" được áp dụng xuyên suốt toàn bộ nền tảng Forex CRM / TheNextTrade. Tất cả các AI agents và lập trình viên bắt buộc phải tuân thủ nghiêm ngặt các class tiện ích và design tokens được quy định tại đây.

**Triết Lý Cốt Lõi:**
- **Fintech Cao Cấp (Premium Fintech):** Tinh gọn, hiện đại, chuẩn xác và đáng tin cậy.
- **Chiều Sâu & Hiệu Ứng Kính (Glass & Depth):** Sử dụng viền tinh tế (`dark:border-white/10`), bóng đổ mềm (soft shadows) và bo góc lớn (`rounded-xl` đến `rounded-3xl`). *(Viền `white/5` chỉ dành riêng cho dải phân cách hàng bảng/hover — xem chi tiết tại Mục 2.2).*
- **Điểm Nhấn Sống Động (Vibrant Accents):** Sử dụng các gam màu chuẩn xác gồm Xanh lá `#00C888`, Xanh Cyan `#06B6D4` và Vàng Gold `#F59E0B` trên nền tối có chiều sâu.

---

## 0. Triết Lý Thiết Kế Cao Cấp (Quản Trị Sự Chú Ý)

Một giao diện cao cấp **không bắt đầu từ màu sắc hay hiệu ứng**. Nó bắt đầu từ **6 nguyên tắc quản trị sự chú ý**:

1. **Chốt cảm xúc trước khi vẽ giao diện**
   - Người dùng đang ở trạng thái nào? Cần thao tác nhanh (giao dịch, đặt lệnh), cần tập trung cao độ (học bài Academy, phân tích biểu đồ), hay thư giãn (xem trang cá nhân, bảng tin cộng đồng)?
   - Cảm xúc quyết định mật độ thông tin (density), độ tương phản (contrast) và nhịp độ thị giác (visual rhythm).

2. **Giảm lượng thông tin phải nhìn cùng lúc (Cognitive Load Reduction)**
   - Không phải càng nhiều nội dung hiển thị thì càng tốt.
   - Nguyên tắc cốt lõi: *Người dùng chỉ nên tập trung vào điều gì ở thời điểm này?*
   - Sử dụng cơ chế phân cấp lũy tiến (Progressive Disclosure) thay vì phơi bày tất cả dữ liệu lên cùng một màn hình.

3. **Blur và Transparency để giảm nhiễu (Denoising Depth)**
   - Hiệu ứng Blur và độ trong suốt sinh ra không chỉ để làm đẹp, mà để **những phần chưa quan trọng lùi lại phía sau, không tranh chấp sự chú ý** với tiêu điểm chính.
   - Tuyệt đối cấm các quả cầu màu gradient trôi nổi vô nghĩa (`ambient blur blobs` vô căn cứ), nhưng khuyến khích sử dụng `backdrop-blur` tinh tế trên thanh điều hướng, nền modal và các thẻ nổi để tạo chiều sâu ngăn cách thông tin.

4. **Spacing, bo góc, component đều có quy tắc (Systemic Invariants)**
   - Mọi khoảng cách (4px, 8px, 12px, 16px, 24px, 32px), bo góc (`rounded-xl`, `rounded-2xl`), cấp bậc cỡ chữ (typography scale) đều phải nhất quán từ hệ thống design tokens.
   - Khi hệ thống thống nhất, giao diện tự nhiên sẽ toát lên sự đắt giá, chuyên nghiệp và tin cậy của một tổ chức tài chính hàng đầu.

5. **Interaction phục vụ mục tiêu sản phẩm (Purpose-driven Interaction)**
   - Không phải ứng dụng nào cũng cần nút bấm màu mè hay hiệu ứng hover giật gân.
   - Thao tác giao dịch cần phản hồi chính xác, dứt khoát. Bảng điều khiển theo dõi cần êm dịu, không gây mỏi mắt cho người dùng khi làm việc lâu dài.

6. **Visual UI luôn là bước cuối cùng**
   - Luồng tư duy chuẩn: **UX → Cấu trúc → Kiểm chứng → Cảm xúc → rồi mới đến phần “Đẹp”**.
   - UI cao cấp đến từ: **Tư duy đủ sâu + Hệ thống đủ rõ + Thực thi đủ tiết chế.**
   - *Đến cuối cùng, thiết kế UI không còn là chuyện vẽ màn hình, mà là thiết kế cách người dùng chú ý.*

---

## 1. Hệ Thống Màu Sắc (Color System)

### 1.0 Nghệ Thuật Làm Dịu Thị Giác (5 Yếu Tố Của Một Bảng Màu Cao Cấp)

Một ứng dụng được nhận định là "cao cấp" ngay từ cái nhìn đầu tiên không phải vì dùng nhiều màu sặc sỡ, mà vì designer biết **cách làm dịu thị giác** để người dùng có thể làm việc tập trung hàng giờ liền mà không mỏi mắt:

1. **Màu ít bão hòa (Low Saturation):**
   - Ưu tiên các sắc độ êm dịu: kem, xám nhạt, vàng cát, xanh pastel, slate trầm (`slate-900/950`) thay vì các gam màu neon chói lọi.
   - Giúp giảm cường độ kích thích võng mạc, mang lại cảm giác tĩnh tại, chín chắn và tin cậy của một nền tảng tài chính.

2. **Gradient nhẹ (Subtle Natural Gradients):**
   - Gradient sinh ra để mô phỏng **ánh sáng tự nhiên và chiều sâu**, không phải để khoe màu.
   - Chỉ chuyển màu giữa các sắc độ gần nhau (như `from-gold/15 to-amber-500/10` hoặc `from-[#1E2028] to-[#151925]`). Tuyệt đối cấm các dải chuyển cầu vồng gắt gỏng (như chuyển từ xanh sang đỏ tím trên cùng một nút bấm).

3. **Hình ảnh & Tài nguyên đồng bộ màu sắc (Color-Harmonized Imagery):**
   - Mọi hình ảnh minh họa, icon, mockups biểu đồ, avatar hay preview đồ họa đều phải được tuyển chọn hoặc hiệu chỉnh màu đồng điệu với bảng màu chủ đạo (Gold + Slate/Dark).
   - Tránh việc đưa hình ảnh stock lạc quẻ, lệch tông gây cảm giác chắp vá, thiếu nhất quán.

4. **Màu nhấn dùng có kiểm soát (Controlled Accents - Quy tắc 60-30-10):**
   - 60% là nền tối êm dịu, 30% là các cấu trúc thẻ/nội dung trung tính, và **chỉ 10% dành cho màu nhấn (Gold / Primary Green)**.
   - Màu nhấn chỉ được xuất hiện ở những vị trí mang tính quyết định hành động (CTA chính, số liệu PnL quan trọng, huy hiệu Pro). Nếu chỗ nào cũng gắn màu nhấn, sẽ không còn chỗ nào là điểm nhấn.

5. **Phân cấp bằng màu và khoảng trắng (Hierarchy via Whitespace & Tone):**
   - **Giảm phụ thuộc vào quá nhiều khung, viền, đường chia cắt:** Một sai lầm phổ biến là vẽ viền `border` và dải kẻ `divider` quanh mọi phần tử.
   - Hãy để **khoảng trắng (`padding`, `gap-4`/`gap-6`)** và **sự chênh lệch nhẹ giữa các lớp nền** (`bg-white/5` trên nền `bg-card`) tự làm nhiệm vụ phân tách khu vực một cách tự nhiên, thoáng đãng.

> *"Một bảng màu tốt không chỉ để đẹp. Nó giúp người dùng nhìn lâu hơn, đọc dễ hơn và tin tưởng sản phẩm hơn."*

---

### 1.1 Màu Nền (Chế Độ Tối - Dark Mode)
Tuyệt đối không sử dụng class mặc định `gray-900`. Bắt buộc dùng đúng các mã màu hex sau:

| Bề mặt (Surface) | Class | Mã Hex | Mục đích sử dụng |
|:---|:---|:---|:---|
| **Nền Trang Chính** | `dark:bg-[#0F1117]` | `#0F1117` | Nền body trang (*lưu ý: globals.css sẽ ánh xạ class này thành `transparent` để lộ gradient nền body*). |
| **Nền Phụ** | `dark:bg-[#0B0E14]` | `#0B0E14` | Nền cho các section hoặc khối phụ xen kẽ. |
| **Bề Mặt Thẻ (Card)** | `dark:bg-[#1E2028]` | `#1E2028` | Thẻ nổi (floating cards), bảng điều khiển (panels). |
| **Bề Mặt Ô Nhập (Input)** | `dark:bg-[#151925]` | `#151925` | Ô nhập liệu form (inputs), hộp chọn (select boxes). |
| **Tiêu Đề Bảng / Trạng Thái Hover** | `dark:bg-white/5` | `rgba(255,255,255,0.05)` | Hàng bảng dữ liệu, trạng thái inactive hoặc hover. |

> **Cơ chế ghi đè Runtime (trong `globals.css`, các khối `.dark`):**
> - `bg-[#0F1117]` → `transparent`;
> - `bg-[#1E2028]` / `bg-[#1A1D27]` → `hsl(var(--card) / 0.75)` + `backdrop-blur`;
> - `bg-[#151925]` → `hsl(var(--card) / 0.95)`;
> - `bg-[#0B0E14]` → `hsl(var(--background) / 0.5)`;
> - Các class chuẩn `bg-gray-900/800/slate-900/800` → nền thẻ/khung bán trong suốt.
> - **Nhóm màu trang chủ (Homepage family - hợp lệ trên các trang public):** `dark:bg-card` (`#12172a`), `dark:bg-[#111318]`, `dark:bg-white/[0.02]`.
>
> **Gradient nền body Dark Mode:** Trong chế độ tối, thẻ `body` sử dụng gradient cố định `linear-gradient(135deg, #2b2344 0%, #193451 50%, #06454f 100%)` (`globals.css`). Vì `bg-[#0F1117]` được ánh xạ thành `transparent`, màu nền thực tế hiển thị sẽ là dải chuyển tím → xanh navy → xanh teal thẫm này. Tránh chồng các wrapper tối màu đục (`opaque dark`) lên trên trừ khi section đó thực sự cần một bề mặt card đặc.

### 1.2 Màu Thương Hiệu (Brand Colors)

| Màu sắc | Class | Mã Hex | Mục đích sử dụng |
|:---|:---|:---|:---|
| **Xanh Lá Chính (Primary Green)** | `bg-primary` | Thay đổi theo theme | Nút kêu gọi hành động (CTA), trạng thái thành công. |
| **Primary Hover** | `hover:bg-[#00B078]` | `#00B078` | Trạng thái hover cho nút Xanh lá chính (trong `buttonVariants`). |
| **Vàng Gold** | `bg-gold` / `text-gold` | `#F59E0B` | Điểm nhấn Pro/Premium, nút nâng cấp, huy hiệu. |
| **Gold Gradient** | `from-amber-500 to-orange-500` (community/VIP) hoặc `from-gold to-amber-600` (homepage/tools) | `#F59E0B → #F97316` | Nút bấm Premium CTA, khối nổi bật gói Pro. |
| **Màu Nhấn / Thông Tin (Info/Accent)** | `text-cyan-500` | `#06B6D4` | Biểu tượng, đường dẫn, văn bản nổi bật. |
| **Xanh Dương Hành Động (Blue Action)** | `bg-[#2F80ED]` | `#2F80ED` | Hành động phụ, nút Lưu dữ liệu. |
| **Màu Cảnh Báo / Lỗi (Danger)** | `text-red-500` | `#EF4444` | Thông báo lỗi, PnL âm, hành động xóa. |

#### Hướng Dẫn Sử Dụng Màu Vàng Gold (Gold Color Usage Guide)
Gam màu **Gold** được dành riêng cho các bối cảnh **cao cấp / nâng cấp (premium / upgrade)**:
- **Huy hiệu & Thẻ Gói Pro:** Nền biểu tượng, viền tạo điểm nhấn, chữ nổi bật.
- **Nút Kêu Gọi Nâng Cấp (Upgrade CTA):** Sử dụng gradient `from-amber-500 to-orange-500` cho các nút tạo chuyển đổi mạnh.
- **Điểm nhấn tinh tế:** Sử dụng `bg-gold/10` hoặc `text-gold` cho nền mờ icon, viền ring highlight.
- **Chế độ tối (Dark mode):** Sử dụng `dark:text-amber-400` và `dark:bg-amber-500/15` để tạo độ tương phản dịu mắt.

```tsx
// Nút bấm điểm nhấn Gold (CTA nâng cấp tài khoản Pro)
<Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600">
  <Crown size={16} /> Upgrade to Pro
</Button>

// Huy hiệu Gold (Pro Badge)
<span className="bg-gold/10 text-gold ring-1 ring-gold/30 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20 rounded-lg px-2 py-0.5 text-xs font-bold">
  PRO
</span>
```

---

## 2. Các Thành Phần Giao Diện (Components)

### 2.1 Nút Bấm (Buttons)
Nút bấm phải có hiệu ứng chuyển đổi mượt mà, độ sâu tinh tế và căn chỉnh khoảng cách nghiêm ngặt.

**Quy Tắc Toàn Cục:**
- **Căn lề:** Luôn luôn sử dụng `inline-flex items-center justify-center gap-2`.
- **Biểu tượng (Icons):** TUYỆT ĐỐI KHÔNG thêm margin thủ công (như `mr-2`). Khoảng cách `gap-2` đã tự động xử lý.
- **Điều hướng:** Đối với các hành động chuyển trang ("Tạo mới/Thêm"), ưu tiên dùng helper `buttonVariants` trên `<Link>` HOẶC bọc trong Client Component:
  ```tsx
  // Cách A (Ưu tiên hàng đầu cho SEO và hiệu năng):
  <Link href="..." className={buttonVariants({ variant: 'primary' })}>... </Link>
  
  // Cách B (Nút tương tác có logic sự kiện):
  <Button onClick={() => router.push('...')}> ... </Button>
  ```

**Nút Primary CTA (Xanh Lá Chính)**
Dùng cho các hành động trọng yếu: "Tạo mới (Create)", "Thêm mới (Add New)", "Lưu (Save)". Kích thước mặc định `md` = `px-6 py-2.5 text-sm`.
```tsx
// Chuẩn — không cần khai báo kích thước thủ công, Button.tsx đã quản lý
<Button variant="primary">
  <Icon size={20} />
  <span>Button Text</span>
</Button>

// Kích thước lớn — chỉ dùng cho Hero Section hoặc các CTA chính của trang
<Button variant="primary" size="lg">
  <Icon size={20} />
  <span>Major Action</span>
</Button>
```

**Quy Chuẩn Phân Cấp Kích Thước Button (Button Sizing Hierarchy):**
Mọi nút bấm trên trang phải tuân thủ nghiêm ngặt theo các cấp độ kích thước chuẩn sau, **TUYỆT ĐỐI KHÔNG** gõ tay các thông số padding/height tự do gây lệch chuẩn giữa các section:

- **Tier 1: Hero Primary CTA (Nút mở đầu tại Hero)**
  - Chiều cao: `h-11 sm:h-12` (44px trên mobile, 48px trên desktop).
  - Padding: Cố định `px-5 sm:px-7` đồng đều cho cả nút chính và nút phụ đi kèm.
  - Typography: `font-extrabold text-sm sm:text-base`.
  - Icon: Cố định `size={16}`.

- **Tier 2: Section Primary CTA (Các nút hành động chính giữa các section)**
  - Chiều cao: Thống nhất chuẩn **`min-h-12` (48px cố định)** trên toàn bộ trang.
  - Padding: Thống nhất `px-8` cho nút độc lập giữa trang; `px-6` cho nút đôi trong cột hẹp.
  - Typography: `font-extrabold text-sm`.
  - Icon mũi tên `<ArrowRight>`: Cố định `size={16}` kèm `group-hover:translate-x-1 duration-300`.
  - Đổ bóng: `shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)]`.

- **Tier 3: Compact / In-Card Action (Nút nhỏ trong bảng, thẻ con, dropdown trigger)**
  - Chiều cao: `min-h-9` hoặc `min-h-10` (36px - 40px).
  - Typography: `font-bold text-xs`.
  - Icon: `size={12}` hoặc `size={14}`.

**Nút Hành Động Phụ (Secondary Action - Xanh Dương)**
Dùng cho các hành động phụ như "Xuất file (Export)", "Lưu tạm".
```tsx
<Button variant="secondary">
  Save Changes
</Button>
```

**Nút Biểu Tượng (Icon Button - Ghost)**
Dùng cho các nút kích hoạt chỉ có biểu tượng hoặc hành động "Xóa/Đóng".
```tsx
<Button
  variant="ghost"
  size="icon"
  className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
  aria-label="Action description"
>
  <Icon size={20} />
</Button>
```
*Lưu ý: Kích thước biểu tượng chuẩn = `size="icon"` → `h-10 w-10 p-0`. Chỉ ghi đè với `h-9 w-9` hoặc `w-auto h-auto p-0` cho các hàng bảng dữ liệu nhỏ gọn.*

**Nút Hủy / Trung Tính (Cancel / Neutral - Ghost)**
Dùng cho hành động "Hủy (Cancel)" hoặc "Quay lại" trong các hộp thoại modal.
```tsx
<Button
  variant="ghost" 
  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
>
  Cancel
</Button>
```

### 2.2 Thẻ (Cards), Khung Chứa & Đường Viền (Borders)
Hệ thống sử dụng bán kính bo góc lớn nhằm tạo cảm giác "thân thiện nhưng đậm chất cao cấp", đi cùng quy tắc màu viền nghiêm ngặt để bảo đảm độ tương phản.

**Tiêu Chuẩn Đường Viền (CỰC KỲ QUAN TRỌNG):**
- **Chế độ sáng (Light Mode):** LUÔN LUÔN dùng `border-gray-200` để đảm bảo sự phân tách mạch lạc giữa các phần. TUYỆT ĐỐI KHÔNG dùng `border-gray-100` vì màu quá mờ nhạt.
- **Chế độ tối (Dark Mode):** LUÔN LUÔN dùng `dark:border-white/10` để tạo đường viền thanh lịch trên nền tối. TUYỆT ĐỐI KHÔNG dùng `dark:border-white/5` vì quá tối và chìm.
- **Trường hợp ngoại lệ (CHỈ áp dụng cho dải phân cách & hover):** `border-gray-100` / `dark:border-white/5` **chỉ được phép** dùng cho dải phân cách hàng trong bảng (`divide-*`, viền dưới `<th>`), trạng thái hover không kích hoạt và nền tiêu đề bảng — tuyệt đối không dùng trên đường viền thẻ card, panel hoặc section.

**Thẻ Chuẩn (Standard Card - Sáng/Tối)**
```tsx
<div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 shadow-sm border border-gray-200 dark:border-white/10 group hover:shadow-md transition-shadow">
  {/* Nội dung bên trong */}
</div>
```
*Lưu ý: Dùng `rounded-xl` cho các thẻ tính năng chính, `rounded-lg` cho các tiện ích phụ nhỏ hơn.*

**Bảng Hiệu Ứng Kính (Glass Panel - Điểm Nhấn / Kết Quả)**
```tsx
<div className="bg-[#1E2028] text-white rounded-xl p-8 shadow-2xl relative overflow-hidden border border-gray-200 dark:border-white/10">
    {/* Hiệu ứng hào quang nhẹ (Tùy chọn) */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
    
    {/* Nội dung chính (z-10) */}
    <div className="relative z-10">...</div>
</div>
```

### 2.3 Ô Nhập Liệu Form (Form Inputs)
*(Đối với các quy chuẩn chuẩn hóa riêng cho trang Admin, xem **Mục 13**).*

**Ô Nhập Liệu Nổi Bật (Hero Input - Trang Đăng Nhập / Landing Page)**
Dành cho các khu vực trung tâm đòi hỏi trọng lượng thị giác lớn.
```tsx
<div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
       <Icon size={18} className="text-gray-500 group-focus-within:text-[#00C888] transition-colors" />
    </div>
    <input
      type="text"
      className="block w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#151925] border-2 border-transparent focus:border-[#00C888] focus:bg-white dark:focus:bg-[#1E2028] transition-all font-bold text-lg outline-none"
    />
</div>
```

### 2.4 Huy Hiệu & Nhãn Trạng Thái (Badges / Status Chips)
```tsx
// Thành công (Xanh lá)
<span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg text-xs font-bold">
  Active
</span>

// Hành động mua / Điểm nhấn chính (Xanh dương)
<span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg text-xs font-bold">
  Buy
</span>
```

### 2.5 Hộp Kiểm Tùy Chỉnh (Custom Checkboxes)
Tránh dùng `<input type="checkbox">` native làm vỡ UI trên các trình duyệt khác nhau. Sử dụng `Button` ghost component với icon `CheckSquare` / `Square` của Lucide.

**Hộp Kiểm Tiêu Chuẩn Cho Form & Bảng:**
```tsx
<Button 
    type="button"
    variant="ghost" 
    size="icon" 
    onClick={() => setChecked(!checked)} 
    className={`w-auto h-auto p-0 hover:bg-transparent transition-colors ${checked ? 'text-primary' : 'text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
    aria-label="Toggle Selection"
>
    {checked ? <CheckSquare size={20} aria-hidden="true" /> : <Square size={20} aria-hidden="true" />}
</Button>
```
*Lưu ý cho Bảng dữ liệu:* Cột checkbox ở Header và Row phải đồng nhất class (Ví dụ: `w-14 pl-6 pr-4 py-5`) để đảm bảo các ô tự do thẳng hàng. Trong bảng dày đặc, giữ `size="icon"` rồi ghi đè `w-auto h-auto p-0` để thu gọn — đúng chuẩn icon-size nêu ở Mục 2.1.

---

## 3. Kiểu Chữ & Thứ Bậc Văn Bản (Typography)

**Họ Phông Chữ (Font Family):** 
- Văn bản nội dung (body): **Source Sans 3** (`font-sans`).
- Tiêu đề (headings): **Lexend** (`font-heading`).
- Thiết lập tại `layout.tsx` qua `Source_Sans_3` và `Lexend`; các thẻ h1–h6 mặc định sử dụng Lexend (`globals.css`). TUYỆT ĐỐI KHÔNG dùng `font-outfit` — token này không tồn tại trong hệ thống.

**Tiêu Đề (Headings):**
- **Tiêu đề trang Admin / Dashboard:** `text-xl font-black text-gray-700 dark:text-white tracking-tighter`
- **Tiêu đề trang Public / Marketing:** `text-4xl md:text-5xl font-bold tracking-tight text-gray-700 dark:text-white`
- **Tiêu đề Section:** `text-2xl font-bold`
- **Tiêu đề Card:** `text-lg font-bold flex items-center gap-2` (thường kết hợp thanh pill trang trí)

**Văn Bản (Text):**
- **Nội dung chung (Body):** `text-gray-500 dark:text-gray-500`
- **Nhãn phụ (Muted Label):** `text-xs font-bold text-gray-500 uppercase tracking-wider`

---

## 4. Mô Hình Bố Cục (Layout Patterns)
*(Xem **Mục 13** cho các tiêu chuẩn bắt buộc riêng cho trang Quản trị Admin).*

### 4.1 Khung Bao Trang Chung (Page Wrapper - General / Marketing)
```tsx
<div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-700 dark:text-white">
  <PublicHeader />
  <main className="py-20 px-4">
     <div className="max-w-4xl mx-auto">
        {/* Nội dung trang */}
     </div>
  </main>
  <SiteFooter />
</div>
```

### 4.2 Khoảng Cách Trang & Khoảng Trống Giữa Các Section
- **Padding đỉnh trang (Top Padding):** TUYỆT ĐỐI KHÔNG thêm `pt-` hoặc `py-` vào wrapper trang chính của bạn. Layout khung ngoài đã tự động căn chỉnh khoảng trống cách thanh điều hướng.
- **Khoảng cách giữa các Section (Section Gaps):** Sử dụng `16px` (`gap-4` / `space-y-4`) bên trong cụm widget phụ, và `24px` (`gap-6` / `space-y-6`) giữa các section chính — chỉ dùng `space-y-10`/`space-y-14` cho các khối lớn cấp cao nhất của trang. Tuyệt đối không trộn lẫn `gap-4` và `gap-6` trong cùng một ngăn xếp dọc; hãy giữ nhịp điệu đồng đều cho mỗi card/panel.

### 4.3 Biểu Tượng Trang Trí (Decorative Icons)
Dùng ở tiêu đề trang hoặc trạng thái trống (empty states).
```tsx
<div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyan-500/10 text-cyan-500 mb-6 ring-4 ring-cyan-500/5">
    <Icon size={32} />
</div>
```

---

## 5. Chuyển Động & Hiệu Ứng (Animation)
- **Hover Lift:** NGHIÊM CẤM dùng `hover:-translate-y` trên bất kỳ phần tử nào (cả nút bấm lẫn card). Chỉ dùng `hover:shadow` để tạo chiều sâu nâng lên.
- **Fade In:** `animate-in fade-in slide-in-from-top-4`
- **Blur Glow:** `blur-[60px] opacity-20` (cho các điểm sáng phụ trợ có kiểm soát)

---

> **Nguyên Tắc Nằm Lòng:** Nếu một thành phần nhìn giống hệt component mặc định của Tailwind, điều đó có nghĩa là bạn đang làm sai. Hãy bo góc `rounded-xl`, bổ sung viền `dark:border-white/10` và tăng padding hợp lý. Hãy làm cho nó toát lên đẳng cấp "Premium".

---

## 6. Các Mô Thức Tương Tác (Interactive Patterns)

### 6.1 Thẻ Tương Tác (Interactive Cards - Hiệu Ứng Hover)
Áp dụng cho các widget dashboard, danh sách khóa học academy và bất kỳ thẻ card nào có thể nhấn:
- **Độ đổ bóng (Shadow):** BẮT BUỘC dùng `shadow-sm` → `hover:shadow-md`.
- **Nâng bề mặt (Lift):** NGHIÊM CẤM dùng `hover:-translate-y` trên mọi thành phần. Dùng `hover:shadow-md` thay thế.
- **Bo góc (Rounding):** BẮT BUỘC dùng `rounded-xl`.
- **Hiệu ứng chuyển đổi (Transition):** BẮT BUỘC dùng `transition-shadow` (không dùng transition-all trừ khi cần đổi màu nền).

```tsx
<div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    {/* Nội dung bên trong */}
</div>
```

### 6.2 Cửa Sổ Nổi (Modal Components - Nhấn Backdrop Để Đóng)
Tất cả các Modal tùy biến BẮT BUỘC phải đóng lại khi người dùng nhấn chuột ra ngoài khu vực nội dung modal (nhấn vào phần backdrop).
Để triển khai điều này sạch sẽ, hãy tách backdrop và hộp nội dung thành 2 phần tử ngang hàng (sibling elements) bên trong container gốc `inset-0`.

**Kiến Trúc Chuẩn:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* 1. Lớp phủ Backdrop (Xử lý onClick để đóng modal) */}
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
    
    {/* 2. Hộp nội dung Modal (z-10 bảo đảm nổi lên trên lớp backdrop) */}
    <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1E2028] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">Nội dung modal</div>
    </div>
</div>
```

---

## 7. Tiêu Chuẩn Khả Năng Tiếp Cận (Accessibility Standards)
Tất cả các thành phần phải tuân thủ **Web Interface Guidelines**.

- **Trạng thái Focus:** Không bao giờ dùng `outline-none` đơn độc. Luôn đi kèm với `focus-visible:ring`.
- **Ô Nhập Liệu (Inputs):**
  - Bắt buộc dùng component `PremiumInput`.
  - Phải có `role="alert"` cho các thông báo lỗi.
  - Phải dùng `aria-invalid` khi trường dữ liệu bị lỗi.
- **Nút Bấm (Buttons):**
  - Bắt buộc dùng component `Button` từ `@/components/ui/Button`.
  - Bắt buộc hỗ trợ điều hướng bằng bàn phím (keyboard navigation).
- **Chế Độ Tối (Dark Mode):**
  - Thẻ `<html>` phải khai báo thuộc tính `style={{ colorScheme: 'dark' }}`.

---

## 8. Thành Phần Premium Tham Chiếu (Components Reference)

**PremiumInput:**
Tự động tiếp nhận `label`, `icon`, `error`, và liên kết thuộc tính `htmlFor`:
```tsx
<PremiumInput 
    label="Email Address"
    icon={Mail}
    placeholder="hello@example.com"
    error={state.errors?.email}
/>
```

**Button:**
Hỗ trợ đầy đủ các biến thể (`primary`, `secondary`, `accent`, `ghost`, `link`, `outline`, `destructive`), các kích cỡ (`sm`, `smd`, `md`, `lg`, `icon`), và trạng thái tải `isLoading`. Tự động xử lý khoảng cách biểu tượng `flex gap-2`:
```tsx
<Button variant="primary" isLoading={isPending}>
    Save Changes
</Button>

// Dành cho liên kết chuyển trang:
<Link href="..." className={buttonVariants({ variant: 'primary' })}>
  Link Button
</Link>
```

---

## 9. Quy Tắc Vệ Sinh Mã Nguồn (Code Hygiene Rules - CỰC KỲ QUAN TRỌNG)

Các quy tắc này được kiểm tra gắt gao trong mỗi đợt Code Review và kiểm thử QA.

### 9.1 Chính Sách 100% Tiếng Anh Trên Giao Diện Người Dùng (English Only on UI)
**NGHIÊM CẤM** hardcode chữ Tiếng Việt trên giao diện người dùng ứng dụng. Tất cả các văn bản hiển thị cho người dùng (Toast thông báo, Alert cảnh báo, Placeholder, Empty State, Button label) phải là 100% Tiếng Anh.
- ❌ `"Đang tải..."` → ✅ `"Loading...""`
- ❌ `"Tính năng đang phát triển"` → ✅ `"Coming soon"`

### 9.2 Tuyệt Đối Không Dùng Emoji Làm Biểu Tượng (No Emoji Icons)
**NGHIÊM CẤM** dùng Emoji (🚀, 📈, ❌, ✅) làm biểu tượng tính năng trên giao diện. BẮT BUỘC sử dụng thư viện `lucide-react`.
- ❌ `🔒` → ✅ `<Lock size={16} />`
- ❌ `✅` → ✅ `<CheckCircle size={16} />`

### 9.3 Không Làm Ô Nhiễm Bảng Điều Khiển Console (No Console Pollution)
**NGHIÊM CẤM** để lại `console.log()` hoặc `console.error()` trong mã nguồn chạy trên production.
- Dùng `toast.error()` cho các thông báo lỗi hiển thị tới người dùng.
- Xóa toàn bộ các đoạn log gỡ lỗi trước khi commit.

### 9.4 Chính Sách Con Trỏ Toàn Cục (Global Cursor Policy)
Con trỏ mặc định là `default` (mũi tên) cho toàn bộ ứng dụng. Quy tắc được thiết lập trong `globals.css` (unlayered, `!important`):
- Tất cả elements → `cursor: default`
- `a`, `button`, `select`, `[role="button"]` → `cursor: pointer`
- `input`, `textarea`, `[contenteditable]` → `cursor: text`

> **Không cần** thêm thủ công `cursor-default` vào từng component. Global CSS đã xử lý tự động.

---

## 10. Tiêu Chuẩn Bán Kính Bo Góc (Border Radius Standards)

| Mức tối thiểu | Class | Phạm vi sử dụng |
|:---|:---|:---|
| **Cards, Modals, Inputs** | `rounded-xl` | Bắt buộc mặc định cho mọi container và ô nhập chính |
| **Badges, Tags, Chips** | `rounded-lg` | Dành cho các nhãn, huy hiệu nhỏ hơn |
| **Pills, Trạng Thái Chấm** | `rounded-full` | Dành cho các chỉ báo trạng thái tròn |

> **NGHIÊM CẤM** dùng `rounded-md`, `rounded-sm`, hoặc `rounded` đơn thuần. Mức tối thiểu cho mọi thành phần là `rounded-lg`.

---

## 11. Quy Tắc Nhãn Tab & Bộ Lọc (Tab & Filter Label Rules)

Các nhãn văn bản trong thanh Tab bars và Filter bars **BẮT BUỘC** phải có class `whitespace-nowrap` để tránh hiện tượng bẻ gãy dòng khi tiêu đề dài (Ví dụ: "MT5 Expert Advisor").

```tsx
<span className="whitespace-nowrap">{label}</span>
```

---

## 12. Khả Năng Tiếp Cận Của Nút Biểu Tượng (Icon Button Accessibility)

Mọi nút bấm chỉ chứa biểu tượng (không có chữ đi kèm) **BẮT BUỘC** phải có thuộc tính `aria-label` mô tả rõ ràng hành động thực hiện:

```tsx
// ✅ Đúng
<Button variant="ghost" aria-label="Close modal">
    <X size={20} />
</Button>

// ❌ Sai — thiếu thuộc tính aria-label
<Button variant="ghost">
    <X size={20} />
</Button>
```

---

## 13. Tiêu Chuẩn Giao Diện Trang Quản Trị (Admin Dashboard Standards)

Khu vực này tổng hợp TOÀN BỘ các tiêu chuẩn thiết kế cấu trúc tĩnh TRỰC QUAN NHẤT dành riêng cho Admin Dashboard & Bảng dữ liệu. Nghiêm cấm làm sai trên mọi trang `/admin/*`.

### 13.1 Bố Cục Trang Admin Tổng Quát
- **Nội dung Trải Rộng (Full Width Content):** Nội dung trang Admin phải được **căn trái** và trải dài thẳng thắn theo container, không được giới hạn chiều rộng kiểu bài báo hay canh giữa như các trang public.
- **Padding:** Dùng `<div className="w-full max-w-full py-6 pr-6">` (hoặc cấu trúc bọc sẵn của Admin Layout) để thiết lập không gian. NGHIÊM CẤM dùng `max-w-4xl mx-auto`.

### 13.2 Tiêu Đề Trang Quản Trị (Admin Page Header)
Có **2 kiểu** Page Header tùy theo ngữ cảnh sử dụng:

#### A. Full Header (Dành cho trang Quản trị Admin — `/admin/*`)
Dành cho các trang quản trị có nút hành động lớn nằm ở bên phải. **Không hiển thị tiêu đề H1** (sidebar đã làm nhiệm vụ đánh dấu trang hiện tại) — chỉ giữ thanh phân tách màu thương hiệu + mô tả ngắn + cụm nút hành động.

- **Thanh Phân Tách:** `w-1.5 h-8 bg-primary rounded-full`
- **Tiêu đề (Title):** `text-xl font-black text-gray-700 dark:text-white tracking-tighter`
- **Mô tả (Description):** `text-base text-gray-500 dark:text-gray-500 font-medium`
- **Hành động (Actions):** Cụm Button phía bên phải có shadow đổ bóng.

```tsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
            <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tighter">
                [Tên Trang]
            </h1>
        </div>
        <p className="text-base text-gray-500 dark:text-gray-500 font-medium pl-4.5">
            [Mô tả trang ngắn gọn]
        </p>
    </div>
    <div className="flex items-center gap-3">
        {/* Nút hành động chính */}
        <Link href="..." className={buttonVariants({ variant: 'primary' })}>
            <Plus size={18} strokeWidth={2.5} /> Add New
        </Link>
    </div>
</div>
```

#### B. Minimal Header (Dành cho trang Người dùng Dashboard — `/dashboard/*`)
**BỎ tiêu đề H1 hiển thị** vì thanh điều hướng sidebar đã làm nổi bật menu hiện tại. BẮT BUỘC dùng component `PageHeader` (`@/components/ui/PageHeader`).

**Thành Phần: `PageHeader`**
- Tự động render `<h1 className="sr-only">` phục vụ SEO (thông qua prop `title`).
- **Description:** Dòng mô tả xanh thương hiệu với `border-l-4 border-primary`.
- **Children:** Khối Filter / Button / Badge bên phải (trên tablet trở lên nằm cùng hàng, trên mobile tự động xếp chồng dọc).
- **Props đặc biệt:**
  - `mobileFullWidthButton` — thành phần con tự động chiếm toàn bộ chiều ngang trên mobile (`w-full`). Dành cho nút bấm CTA hoặc DateRangePicker.

**Hành Vi Responsive:**

| Kích thước màn hình | Hành vi bố cục |
|:---|:---|
| **Mobile** (< 640px) | Xếp chồng theo chiều dọc. Description có **nền tràn toàn chiều rộng** (`w-full rounded-lg`). Khối children tự động xuống hàng riêng. |
| **Tablet** (≥ 640px / `sm:`) | Description + Children cùng nằm trên 1 hàng. Description thu gọn dạng `w-fit rounded-r-lg`. |

```tsx
// Chuẩn — mô tả + bộ lọc cùng hàng (tablet trở lên), xếp chồng dọc (mobile)
<PageHeader
    title="Journal"
    description="Track your trades and analyze your performance."
>
    <DashboardFilter currentAccountId={accountId || undefined} />
</PageHeader>

// Với nút bấm full-width trên thiết bị di động
<PageHeader
    title="Strategies"
    description="Your strategies for trading."
    mobileFullWidthButton
>
    <Link href="/new" className={buttonVariants({ variant: 'primary' })}>
        New Strategy
    </Link>
</PageHeader>
```

**Thành Phần: `TabBar` — Responsive `equalWidth`**
Prop `equalWidth` cho phép các tab dàn đều bằng nhau (50% cho 2 tabs, 33.3% cho 3 tabs):

| Kích thước màn hình | Hành vi bố cục |
|:---|:---|
| **Mobile / Tablet** (< 1024px) | Các Tab dàn đều theo chiều ngang với `flex-1`, khung chứa `w-full flex`. |
| **Laptop Trở Lên** (≥ 1024px / `lg:`) | Các Tab thu gọn tự nhiên với `lg:flex-none`, khung chứa `lg:w-auto lg:inline-flex`. |

```tsx
<TabBar tabs={journalTabs} equalWidth />
```

**Thành Phần: `DashboardFilter` — Responsive `equalWidth`**
Prop `equalWidth` cho phép AccountSelector và DateRangePicker chia đều 50% diện tích trên màn hình tablet trở lên:

```tsx
// 50% cho mỗi khối lọc trên tablet
<DashboardFilter currentAccountId={accountId || undefined} equalWidth />

// Hoán đổi thứ tự hiển thị trên mobile bằng CSS order
<DashboardFilter
    currentAccountId={accountId || undefined}
    equalWidth
    className="order-first lg:order-none"
/>
```

**Mô Thức Bố Cục Theo Từng Trang Cụ Thể:**

| Trang | Bố cục (Mobile → Tablet → Desktop) |
|:---|:---|
| `/accounts` | PageHeader: mô tả + nút bấm |
| `/strategies` | PageHeader: mô tả + nút bấm (`mobileFullWidthButton`) |
| `/journal` | PageHeader → DashboardFilter (`equalWidth`, `order-first`) → TabBar (`equalWidth`) |
| `/sessions` | PageHeader → DashboardFilter (`equalWidth`) → TabBar (`equalWidth`) |
| `/analytics` | PageHeader + AccountSelect (children) → TabBar (`equalWidth`) |
| `/reports`, `/mistakes` | PageHeader → TabBar (`equalWidth`) |
| `/academy` | PageHeader + 2 badges (50% diện tích mỗi badge qua `flex-1 sm:flex-none`) |
| `/psychology` | PageHeader + DateRangePicker (`mobileFullWidthButton`) |
| `/trading-systems` | PageHeader (chỉ có mô tả) |

### 13.3 Ô Nhập Liệu Chuẩn Form (Admin / Modals)
Dành cho mọi form nhập liệu nội bộ, bắt buộc sử dụng cấu trúc Input sau (thay thế cho các thẻ input trôi nổi):

```tsx
<div className="group">
    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        Label <span className="font-normal text-gray-500">(Optional)</span>
    </label>
    <input
        type="text"
        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-[#00C888] focus:ring-2 focus:ring-[#00C888]/20 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-500"
        placeholder="Placeholder text..."
    />
    <p className="text-red-500 text-xs mt-1">Error message here</p>
</div>
```
*Ghi chú căn lề khoảng cách Form Modal:*
- Khung form cha: `space-y-5`.
- Khung nằm sát Header: `-mt-4`.
- Nhãn Label: `mb-2`.
- Tuyệt đối không dùng khoảng cách xen kẽ chắp vá như `space-y-1.5`.

### 13.4 Ô Tìm Kiếm Trên Toolbar (Đồng Bộ Chiều Cao 38px)
Trên thanh công cụ Toolbar chứa Bảng dữ liệu Data Table, Ô Input Search phải đạt **chiều cao chính xác 38px** (tương đương với DropdownMenu kích cỡ md). Bắt buộc phải **bọc thẻ div ngoài và reset CSS cho ô input bên trong**:

```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md">
    <Search size={18} className="text-gray-500" />
    <input
        type="text"
        placeholder="Search..."
        className="bg-transparent text-sm focus:outline-none w-full text-gray-700 dark:text-white placeholder:text-gray-500"
    />
</div>
```

### 13.5 Bộ Lọc Dropdown (Quy Tắc Nghiêm Ngặt)
**NGHIÊM CẤM** dùng thẻ `<select>` HTML Native trên bộ lọc bảng Admin Table Filters. **BẮT BUỘC** thay bằng Radix UI `DropdownMenu` với Trigger là component `Button variant="outline" size="md"`.

```tsx
<DropdownMenu>
    <DropdownMenuTrigger asChild>
        <Button variant="outline" size="md" className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Status: <span className="text-primary">All</span>
            <ChevronDown size={14} aria-hidden="true" />
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
        <DropdownMenuItem>All Status</DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

### 13.6 Kiến Trúc Trang Dữ Liệu (Thẻ Toolbar & Thẻ Table Riêng Biệt)
BẮT BUỘC tách khu vực Data Table List Overview ra thành 2 khối thẻ (Card) riêng biệt. Tuân thủ tuyệt đối cấu trúc HTML mẫu tham chiếu của `/admin/articles` dưới đây:

```tsx
<div className="space-y-4 pb-10">
    {/* 1. Header Trang (Theo mục 13.2) */}
    {/* 2. Khối Lưới Thống Kê Stats Grid (Tùy chọn) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value="100" icon={IconName} color="indigo" />
    </div>

    {/* 3. Khối Chứa Dữ Liệu Chính */}
    <div className="space-y-6">
        
        {/* 3.1 Thẻ Toolbar Card */}
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            {/* Lưới flexbox chứa Ô tìm kiếm (13.4), Dropdown lọc (13.5), Nút thao tác hàng loạt... */}
        </div>

        {/* 3.2 Thẻ Bảng Dữ Liệu Data Table Card */}
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <tr><th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Column 1</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-700 dark:text-white">Data</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Component phân trang Pagination đặt tại đây */}
        </div>

    </div>
</div>
```

### 13.7 Trạng Thái Tải Dữ Liệu Khung Xương Admin (Skeleton Loading States)
Mọi trang Admin thay vì dùng biểu tượng vòng xoay tròn thì **BẮT BUỘC** gọi tệp `loading.tsx` của Next.js sử dụng các khối Skeleton Block để chống hiện tượng nháy trắng màn hình khi tải trang.

```tsx
export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-in fade-in max-w-5xl mx-auto pt-10">
            {/* Khung Xương Header Admin */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="space-y-2">
                   <div className="h-8 w-64 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
                   <div className="h-4 w-48 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
               </div>
            </div>
            
            {/* Khung Xương Các Thẻ Nội Dung */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 animate-pulse" />
                ))}
            </div>
        </div>
    )
}
```

---

## 14. Thành Phần Tabs (Cấp Trang & Cấp Phân Đoạn)

Tiêu chuẩn thiết kế cho các thanh Tabs điều hướng sử dụng component `@/components/ui/Tabs`. Bắt buộc phải áp dụng cấu trúc dưới đây để đảm bảo giao diện đạt chuẩn Premium và hỗ trợ cuộn ngang mượt mà trên thiết bị di động.

### Cấu Trúc & Bố Cục
```tsx
<div className="overflow-x-auto scrollbar-hide flex">
  <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
    <TabsTrigger 
      value="tab1"
      className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
      activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
      activeTextClassName="!text-white"
    >
      Tab 1
    </TabsTrigger>
  </TabsList>
</div>
```

### Quy Chuẩn CSS Bắt Buộc
- **Khung chứa bên ngoài (Container Wrapper):** BẮT BUỘC có `overflow-x-auto scrollbar-hide flex` để người dùng có thể cuộn ngang nhẹ nhàng trên màn hình nhỏ.
- **Thanh danh sách Tabs (TabsList):** Sử dụng nền mờ và viền bo góc chuẩn: `bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0`.
- **Trạng thái mặc định (TabsTrigger Default):** Class quản lý chữ, đệm và bo góc: `px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10`.
- **Trạng thái kích hoạt (TabsTrigger Active):** BẮT BUỘC phải truyền thủ công 2 override props sau để bảo đảm hiệu ứng gradient chuẩn của hệ thống:
  - `activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"`
  - `activeTextClassName="!text-white"`
