import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Thay khóa API thật của anh vào đây:
const openai = new OpenAI({
  apiKey: 'sk-YOUR_OPENAI_API_KEY_HERE', // Bắt buộc phải thay bằng API key của anh
});

const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'featured');

async function downloadImage(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const articles = await prisma.article.findMany({
    select: { slug: true, title: true, excerpt: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Bắt đầu tiến trình tạo ${articles.length} ảnh tự động qua API ChatGPT (DALL-E 3)...`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const destPath = path.join(TARGET_DIR, `${article.slug}.png`);

    // Bỏ qua nếu ảnh đã tồn tại để nếu có lỗi chạy lại không bị trùng
    if (fs.existsSync(destPath)) {
      console.log(`[${i + 1}/${articles.length}] ⏭️ Bỏ qua ${article.slug}.png (Đã có sẵn)`);
      skipCount++;
      continue;
    }

    const cleanExcerpt = article.excerpt ? article.excerpt.replace(/"/g, "'").trim() : article.title;
    const prompt = `Generate a widescreen premium illustration for a fintech article titled: "**${article.title}**". Concept: The image should visually represent the core concept of the article, which is: "${cleanExcerpt}". Use powerful, abstract, high-tech metaphors to represent this trading/finance concept clearly. Style & Composition: Premium minimalist UI illustration. Deep dark blue background with glowing neon cyan and gold accents to highlight data streams and financial flow. The aesthetic must be high-end, clean, data-driven, and highly professional, avoiding any cartoonish styles. Incorporate subtle UI dashboard elements, sleek geometric shapes, and a futuristic institutional trading vibe.`;

    try {
      console.log(`[${i + 1}/${articles.length}] ⏳ Đang vẽ ảnh cho: ${article.slug}...`);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1792x1024", // Chuẩn khung hình ngang 16:9 của DALL-E 3
      });

      const imageUrl = response.data[0].url;
      await downloadImage(imageUrl, destPath);
      
      console.log(`[${i + 1}/${articles.length}] ✅ THÀNH CÔNG: Đã lưu ${article.slug}.png`);
      successCount++;
      
      // Delay 10 giây giữa mỗi lần tạo để không bị block API Quota của OpenAI
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      console.error(`[${i + 1}/${articles.length}] ❌ LỖI:`, error.message);
      // Nếu lỗi là Rate limit (Tier thấp), dừng luôn để khỏi tốn tiền
      if (error.message.includes("Rate limit")) {
         console.log("🛑 Bị giới hạn Rate Limit của OpenAI, script sẽ tạm dừng. Anh có thể chạy lại lệnh sau vài phút.");
         break;
      }
    }
  }

  console.log(`\n🎉 TIẾN TRÌNH HOÀN TẤT! Tạo mới: ${successCount} ảnh. Bỏ qua: ${skipCount} ảnh.`);
  await prisma.$disconnect();
}

main().catch(console.error);
