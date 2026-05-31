import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseFaq(content) {
  const faqList = [];
  
  // Find where FAQ section starts (supporting variations like <h2>FAQ</h2> or <h2>📝 FAQ</h2>)
  const faqRegex = /<h2[^>]*>(?:[^<]*\s+)?FAQ(?:[^<]*)<\/h2>/i;
  const match = content.match(faqRegex);
  
  if (!match) {
    return faqList;
  }
  
  const faqIndex = match.index;
  // Get content from the start of FAQ onwards
  const faqContent = content.substring(faqIndex + match[0].length);
  
  // Split content by <h3> to isolate each Q&A block
  // We can search for all <h3>...</h3> blocks and their succeeding content
  const qnaRegex = /<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3|<h2|$)/gi;
  let qnaMatch;
  
  while ((qnaMatch = qnaRegex.exec(faqContent)) !== null) {
    const question = qnaMatch[1].replace(/<[^>]*>/g, '').trim();
    let answerHtml = qnaMatch[2].trim();
    
    // Clean up answer: extract text from paragraphs or clean html tags
    // Let's strip figure tags and keep clean paragraph texts
    answerHtml = answerHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
    const cleanAnswer = answerHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (question && cleanAnswer) {
      faqList.push({
        question,
        answer: cleanAnswer
      });
    }
  }
  
  return faqList;
}

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      content: { contains: 'FAQ' }
    },
    take: 3,
    select: {
      title: true,
      content: true
    }
  });

  for (const a of articles) {
    console.log(`\n========================================`);
    console.log(`Parsing Article: ${a.title}`);
    console.log(`========================================`);
    const faqs = parseFaq(a.content);
    console.log(`Found ${faqs.length} FAQs:`);
    faqs.forEach((f, idx) => {
      console.log(`  Q${idx+1}: ${f.question}`);
      console.log(`  A${idx+1}: ${f.answer}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
