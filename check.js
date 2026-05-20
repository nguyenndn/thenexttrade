const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { name: true, image: true }
    });
    
    const featured = await prisma.article.findMany({
        where: { isFeatured: true, status: 'PUBLISHED' },
        select: {
            title: true,
            author: { select: { name: true, image: true } }
        }
    });

    let output = "=== Users ===\n";
    users.forEach(u => {
        output += `User: ${u.name} | Image: ${u.image}\n`;
    });

    output += "\n=== Featured Articles and Authors ===\n";
    featured.forEach(a => {
        output += `Article: "${a.title}" | Author: "${a.author?.name}" | Image: "${a.author?.image}"\n`;
    });

    fs.writeFileSync('check_output.txt', output, 'utf8');
    console.log("Done writing output to check_output.txt");
}

main().catch(console.error).finally(() => prisma.$disconnect());
