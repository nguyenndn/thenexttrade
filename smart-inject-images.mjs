import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function prepareInlineImages() {
  console.log('Fetching remaining articles...');
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, content: true }
  });

  const imagesToGenerate = [];
  let updatedCount = 0;

  for (const article of articles) {
    let content = article.content;
    
    // 1. Strip out all existing <img> tags entirely
    const imgRegex = /<img[^>]*>/gi;
    content = content.replace(imgRegex, '');
    
    // Also remove markdown images if any: ![alt](url)
    const mdImgRegex = /!\[.*?\]\([^)]+\)/g;
    content = content.replace(mdImgRegex, '');

    // 2. Count words to determine length
    // Very simple word count
    const plainText = content.replace(/<[^>]*>?/gm, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    
    // 3. Determine how many images to inject
    const imageCount = wordCount > 1000 ? 3 : 2;
    
    // 4. Inject new <img> tags evenly
    // Let's split the content by paragraphs or headings to find good insertion points.
    // We will look for <h2> or <h3> tags, or just </p> tags.
    // It's safer to split by </p> and distribute evenly.
    const blocks = content.split('</p>');
    if (blocks.length < imageCount + 1) {
      // Very short article, just append to the end or skip
      // We'll still try to inject at the end of what we have
    }
    
    // Calculate roughly where to insert
    const insertIndexes = [];
    for (let i = 1; i <= imageCount; i++) {
      const idx = Math.floor((blocks.length / (imageCount + 1)) * i);
      insertIndexes.push(idx);
    }
    
    let newContent = '';
    let currentImageIndex = 1;
    
    for (let i = 0; i < blocks.length; i++) {
      newContent += blocks[i];
      if (i < blocks.length - 1) {
        newContent += '</p>'; // put the tag back
      }
      
      if (insertIndexes.includes(i)) {
        const newFileName = `${article.slug}-inline-${currentImageIndex}.png`;
        const newSrc = `/images/articles/${newFileName}`;
        const newTag = `\n\n<figure class="my-8"><img src="${newSrc}" alt="${article.title} - Illustration ${currentImageIndex}" class="w-full h-auto rounded-lg shadow-md" /></figure>\n\n`;
        
        newContent += newTag;
        
        // Context is the last ~150 chars of the plain text up to this block
        const contextText = blocks.slice(Math.max(0, i-3), i+1).join(' ').replace(/<[^>]*>?/gm, ' ').trim();
        
        imagesToGenerate.push({
          slug: article.slug,
          articleTitle: article.title,
          imageName: newFileName,
          imagePath: newSrc,
          index: currentImageIndex,
          context: contextText.substring(contextText.length - 200)
        });
        
        currentImageIndex++;
      }
    }
    
    // Update DB
    await prisma.article.update({
      where: { id: article.id },
      data: { content: newContent }
    });
    
    updatedCount++;
    console.log(`✅ Processed [${article.slug}] - Words: ${wordCount} -> Injected ${imageCount} images.`);
  }

  fs.writeFileSync('inline-images-to-generate.json', JSON.stringify(imagesToGenerate, null, 2));
  
  console.log(`\n🎉 Done! Updated ${updatedCount} articles.`);
  console.log(`Total inline images to generate: ${imagesToGenerate.length}`);
  
  await prisma.$disconnect();
}

prepareInlineImages().catch(e => {
  console.error(e);
  process.exit(1);
});
