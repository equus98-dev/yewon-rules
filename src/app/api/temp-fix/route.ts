import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const db = process.env.DB as any;
    
    // First query to get the contents
    const result8285 = await db.prepare("SELECT contentText FROM Article WHERE id = 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f'").first();
    const result8286 = await db.prepare("SELECT contentText FROM Article WHERE id = '38483e4a-f90b-4fc0-8d5f-4759e2d104e6'").first();

    if (!result8285 || !result8286) {
        return NextResponse.json({ error: "Articles not found" });
    }

    const cleanTableHtml = `<table class="rule-table">
  <thead>
    <tr>
      <th colspan="2" class="text-center bg-slate-100 font-bold p-2 border">종전 재적학부(과) 및 전공</th>
      <th colspan="2" class="text-center bg-slate-100 font-bold p-2 border">변경된 재적학부(과) 및 전공</th>
    </tr>
    <tr>
      <th class="text-center bg-slate-50 font-semibold p-2 border">학부(과)</th>
      <th class="text-center bg-slate-50 font-semibold p-2 border">전공</th>
      <th class="text-center bg-slate-50 font-semibold p-2 border">학부(과)</th>
      <th class="text-center bg-slate-50 font-semibold p-2 border">전공</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4" class="text-center p-2 border align-middle">글로벌문화예술경영학부</td>
      <td class="text-center p-2 border align-middle">문화예술경영전공</td>
      <td rowspan="4" class="text-center p-2 border align-middle">글로벌문화경영학부</td>
      <td class="text-center p-2 border align-middle">문화예술경영전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle">한국문화예술전공</td>
      <td class="text-center p-2 border align-middle">한국문화예술전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle">문화예술관광전공</td>
      <td class="text-center p-2 border align-middle">문화예술관광전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle"></td>
      <td class="text-center p-2 border align-middle">K-뷰티전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle">미술문화복지학과</td>
      <td class="text-center p-2 border align-middle"></td>
      <td rowspan="4" class="text-center p-2 border align-middle">미래평생교육학부</td>
      <td rowspan="2" class="text-center p-2 border align-middle">미술문화복지전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle">반려동물산업학과</td>
      <td class="text-center p-2 border align-middle"></td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle"></td>
      <td class="text-center p-2 border align-middle"></td>
      <td rowspan="2" class="text-center p-2 border align-middle">조형예술전공</td>
    </tr>
    <tr>
      <td class="text-center p-2 border align-middle"></td>
      <td class="text-center p-2 border align-middle"></td>
    </tr>
  </tbody>
</table>`;

    const tableMatch = result8286.contentText.match(/(<table[\s\S]*?<\/table>)/i);
    if (tableMatch) {
        const new8285Text = result8285.contentText + '\n' + cleanTableHtml;
        const new8286Text = result8286.contentText.replace(tableMatch[0], '').trim();

        await db.prepare("UPDATE Article SET contentText = ? WHERE id = 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f'").bind(new8285Text).run();
        await db.prepare("UPDATE Article SET contentText = ? WHERE id = '38483e4a-f90b-4fc0-8d5f-4759e2d104e6'").bind(new8286Text).run();

        return NextResponse.json({ success: true, message: "Tables updated successfully." });
    }

    return NextResponse.json({ success: false, message: "Table not found in 8286." });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
