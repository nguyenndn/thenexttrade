const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    select: { title: true, slug: true, content: true },
    orderBy: { createdAt: 'desc' }
  });
  
  let fullyGenerated = [];
  let partiallyGenerated = [];
  let untouched = [];
  let totalMissingImages = 0;
  
  articles.forEach(a => {
    const matches = a.content.match(/<img[^>]+src="([^">]+)"/g);
    if (!matches) return;
    
    let missingInArticle = [];
    matches.forEach(imgTag => {
        const srcMatch = imgTag.match(/src="([^">]+)"/);
        if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            const localPath = path.join(process.cwd(), 'public', src);
            if (!fs.existsSync(localPath)) {
                missingInArticle.push(src);
                totalMissingImages++;
            }
        }
    });
    
    const obj = { title: a.title, slug: a.slug, totalImages: matches.length, missingCount: missingInArticle.length, missingList: missingInArticle };
    
    if (missingInArticle.length === 0) {
        fullyGenerated.push(obj);
    } else if (missingInArticle.length < matches.length) {
        partiallyGenerated.push(obj);
    } else {
        untouched.push(obj);
    }
  });
  
  const date = new Date().toISOString().split('T')[0];
  
  let mdContent = `# Báo Cáo Tracking & Rules Cập Nhật Hình Ảnh Nội Dung Bài Viết
_Ngày báo cáo: ${date}_

---

## 📌 QUY TẮC TẠO ẢNH (BẮT BUỘC TUÂN THỦ KHI TẠO ĐỢT MỚI)
Để AI Agents tiếp theo khi resume công việc không bị "lệch đường ray", BẮT BUỘC tuân thủ các Rule sau khi dùng tool \`generate_image\`:

1. **CHỈ TẠO ẢNH MÔ TẢ TRONG BÀI (INLINE IMAGES):** Tuyệt đối KHÔNG tạo ảnh Thumbnail (Featured Image). Ảnh thumbnail sẽ được tạo bằng API khác.
2. **VIBE & AESTHETICS:** Phong cách "Premium Finance", "Professional", "High Quality", "Modern Tech", "Dark Mode/Blue Accents". Tuyệt đối không dùng phong cách hoạt hình, 3D sến súa hay màu sắc chung chung.
3. **NAMING & PATH:** File tạo ra từ artifact phải được move đúng vào thư mục \`public/images/articles/\` với tên file khớp chính xác 100% với đường dẫn đang thiếu trong Database.
4. **THỰC THI:** Tạo thành từng đợt (10-20 ảnh) tuỳ Quota cho đến khi cạn kiệt. Làm trọn vẹn từng bài, không làm nhảy cóc.

---

## 📊 THỐNG KÊ TỔNG QUAN
- **Số bài viết ĐÃ HOÀN THÀNH 100%:** \`${fullyGenerated.length} bài\`
- **Số bài viết ĐANG LÀM DỞ:** \`${partiallyGenerated.length} bài\`
- **Số bài viết CHƯA ĐỤNG TỚI:** \`${untouched.length} bài\`
- **Tổng số lượng file ảnh còn thiếu:** \`${totalMissingImages} ảnh\`

---

## ✅ DANH SÁCH BÀI VIẾT ĐÃ HOÀN THÀNH (100% Inline Images)
`;

  fullyGenerated.forEach((a, index) => {
    mdContent += `${index + 1}. **${a.title}** (${a.totalImages} ảnh)\n`;
  });

  mdContent += `\n## 🔄 DANH SÁCH BÀI VIẾT ĐANG LÀM DỞ (CẦN ƯU TIÊN FIX TRƯỚC)\n`;
  if (partiallyGenerated.length === 0) {
      mdContent += `_Không có bài nào đang dở dang._\n`;
  } else {
      partiallyGenerated.forEach((a, index) => {
          mdContent += `${index + 1}. **${a.title}** (Còn thiếu ${a.missingCount}/${a.totalImages} ảnh)\n`;
          a.missingList.forEach(m => mdContent += `   - \`${m}\`\n`);
      });
  }

  mdContent += `\n## ⏳ DANH SÁCH BÀI VIẾT CHƯA ĐỤNG TỚI (CÒN THIẾU ẢNH)\n`;
  untouched.slice(0, 50).forEach((a, index) => {
      mdContent += `${index + 1}. **${a.title}** (Thiếu ${a.missingCount} ảnh)\n`;
  });
  if (untouched.length > 50) {
      mdContent += `\n*(Và ${untouched.length - 50} bài viết khác... Danh sách được rút gọn để dễ nhìn)*\n`;
  }

  fs.writeFileSync(path.join(process.cwd(), 'docs', 'INLINE_IMAGE_GENERATION_TRACKER.md'), mdContent);
  console.log('Markdown report generated at docs/INLINE_IMAGE_GENERATION_TRACKER.md');
}

main().finally(() => prisma.$disconnect());
