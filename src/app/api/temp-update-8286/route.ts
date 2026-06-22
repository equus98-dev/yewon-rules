import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const db = process.env.DB as any;
    const articleId = "38483e4a-f90b-4fc0-8d5f-4759e2d104e6";
    
    const result = await db.prepare("SELECT contentText FROM Article WHERE id = ?").bind(articleId).first();
    if (!result) return NextResponse.json({ error: "Not found" });

    let content = result.contentText;
    
    // Replace the specific table's first two rows to use <th> instead of <td>
    // Since it's HTML, we can just replace the specific headers.
    // The table starts with "종전 재적학부(과) 및 전공"
    if (content.includes("종전 재적학부(과) 및 전공")) {
        // Find the table
        const tableMatch = content.match(/<table[\s\S]*?<\/table>/gi);
        if (tableMatch) {
            // It's the LAST table usually, or we can just replace in the matched table
            for (let t of tableMatch) {
                if (t.includes("종전 재적학부(과) 및 전공")) {
                    let newTable = t;
                    // Remove all newlines
                    newTable = newTable.replace(/\r?\n/g, '');
                    // Add tailwind class
                    newTable = newTable.replace(/<table[^>]*>/i, '<table class="custom-rule-table w-full border-collapse border-[2px] border-black text-center text-[13px] my-4 break-keep">');
                    // Add standard td class
                    newTable = newTable.replace(/<td([^>]*)>/gi, '<td$1 class="bg-white border border-slate-300 p-2 align-middle text-slate-800">');
                    
                    // Now, make the top 2 rows <th> instead of <td> so they get shaded
                    // The first row has 2 cells, the second has 4 cells.
                    // We can replace the specific text cells.
                    newTable = newTable.replace(/<td([^>]*)>(.*?)종전 재적학부\(과\) 및 전공(.*?)<\/td>/gi, '<th$1 class="bg-[#f3f4f6] font-bold border border-slate-300 p-2 text-center text-slate-800">$2종전 재적학부(과) 및 전공$3</th>');
                    newTable = newTable.replace(/<td([^>]*)>(.*?)변경된 재적학부\(과\) 및 전공(.*?)<\/td>/gi, '<th$1 class="bg-[#f3f4f6] font-bold border border-slate-300 p-2 text-center text-slate-800">$2변경된 재적학부(과) 및 전공$3</th>');
                    
                    // The second row has "학부(과)" and "전공"
                    // We can just globally replace "학부(과)" and "전공" if they are in td that are short.
                    // Actually, a safer way is to replace `<td` with `<th` and `</td` with `</th` for the first 6 cells? No, string replace on specific content is safer.
                    newTable = newTable.replace(/<td([^>]*)>(.*?)학부\(과\)(.*?)<\/td>/gi, '<th$1 class="bg-[#f3f4f6] font-bold border border-slate-300 p-2 text-center text-slate-800">$2학부(과)$3</th>');
                    newTable = newTable.replace(/<td([^>]*)>(.*?)전공(.*?)<\/td>/gi, '<th$1 class="bg-[#f3f4f6] font-bold border border-slate-300 p-2 text-center text-slate-800">$2전공$3</th>');

                    // Also remove font-weight:bold from all other cells to prevent bold bleeding if we still have the CSS rule, 
                    // though we will remove the CSS rule anyway.
                    newTable = newTable.replace(/font-weight:bold/gi, 'font-weight:normal');
                    newTable = newTable.replace(/<b([^>]*)>/gi, '<span$1>');
                    newTable = newTable.replace(/<\/b>/gi, '</span>');
                    newTable = newTable.replace(/<strong([^>]*)>/gi, '<span$1>');
                    newTable = newTable.replace(/<\/strong>/gi, '</span>');

                    content = content.replace(t, newTable);
                }
            }
        }
    }

    await db.prepare("UPDATE Article SET contentText = ? WHERE id = ?").bind(content, articleId).run();

    return NextResponse.json({ success: true, message: "Article 8286 updated!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
