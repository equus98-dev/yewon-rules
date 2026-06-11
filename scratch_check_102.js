const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rules = await prisma.rule.findMany({
        where: { ruleNumber: '1-0-2' },
        include: {
            revisions: {
                orderBy: { enactmentDate: 'desc' },
                take: 2,
                include: {
                    articles: {
                        where: { articleNumber: 1 },
                        orderBy: { articleNumber: 'asc' }
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(rules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
