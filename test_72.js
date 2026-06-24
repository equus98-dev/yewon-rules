const html = "제72조(하부조직) ① 대학교에 각 처(기획조정처, 교학지원처, 입학홍보처, 행정지원처 등)와 산학협력단을 둔다. (개정 2006.12.18., 2019.02.08., 2021.07.19)\n② 각 처의 장 및 산학협력단장은 조교수 이상으로 보하고, 행정지원처장은 4급이상의 사무직원으로 보한다. (개정 2019.02.08.)\n③ 각 처에는 필요한 팀 또는 부서를 두며, 부처장 또는 팀장은 처장급보다 하위의 교직원으로 보한다. (신설 2019.02.08.)\n④ 대학교에 교육, 연구진흥과 학교발전에 필요한 특수목적사업의 수행을 위하여 필요한 경우 특별기구를 둘 수 있다. 특별기구의 구성 및 운영에 관한 사항은 따로 정한다. (신설 2019.02.08.)\n⑤ 제1항, 제3항의 규정에 의한 분장업무는 따로 정한다. (신설 2019.02.08.)";
let actualBody = html;
const plainText = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/);
if (match) {
    const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
    const regexPattern = titlePart.split('').map(c => 
        c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
    ).join('');
    const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
    actualBody = actualBody.replace(remover, '').trim();
    console.log('titlePart:', titlePart);
    console.log('actualBody after replace:', actualBody);
} else {
    console.log("No match");
}
