const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

async function loadModule() {
  const modPath = path.resolve(__dirname, "..", "scripts", "update-events.mjs");
  return import(pathToFileURL(modPath).href);
}

async function testAllowSapporoAreaVenue() {
  const mod = await loadModule();
  const ev = {
    title: "吉川晃司 LIVE 2026",
    venue: "札幌文化芸術劇場 hitaru",
    venue_address: ""
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), true);
}

async function testRejectOutsideAreaVenue() {
  const mod = await loadModule();
  const ev = {
    title: "CareTEX東京【夏】",
    venue: "東京ビッグサイト 西4ホール",
    venue_address: "東京都江東区有明3-11-1"
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), false);
}

async function testRejectOutsideAreaWithLocalNoiseAddress() {
  const mod = await loadModule();
  const ev = {
    title: "PMFオーケストラ東京公演",
    venue: "東京オペラシティ",
    venue_address: "札幌市長 秋元克広"
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), false);
}

async function testRejectMultiLocationListing() {
  const mod = await loadModule();
  const ev = {
    title: "KOKAMI@network vol.22 「トランス」北海道公演",
    venue: "札幌：カナモトホール／帯広：帯広市民文化ホール",
    venue_address: "札幌市民ホール)／帯広：帯広市民文化ホール"
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), false);
}

async function testRejectTitleOnlyLocalWithoutVenueProof() {
  const mod = await loadModule();
  const ev = {
    title: "【公式】CareTEX札幌",
    venue: "ホームセンター",
    venue_address: "〒108-0073 東京都港区三田1-4-28 三田国際ビル（総合受付：11F）"
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), false);
}

async function testExtractTicketPiaLocalCardDate() {
  const mod = await loadModule();
  const source = { id: "t-pia-jp-hokkaido", name: "チケットぴあ", url: "https://t.pia.jp/hokkaido/", priority: "A" };
  const html = `
    <html>
      <head>
        <title>福山雅治 | チケットぴあ[チケット購入・予約]</title>
        <meta property="og:description" content="2026年1月より、13ヶ所28公演をめぐる全国アリーナツアー開催！" />
        <meta property="og:image" content="https://example.com/flyer.jpg" />
      </head>
      <body>
        <li class="ticketSalesList-2024__item">
          <p class="ticketSalesCard-2024__date">
            <span class="ticketSalesCard-2024__startDate"><time itemprop="startDate" datetime="2026-03-07T00:00:00+09:00"></time></span>
            <span class="ticketSalesCard-2024__endDate"><time itemprop="endDate" datetime="2026-03-08T00:00:00+09:00"></time></span>
          </p>
          <p class="ticketSalesCard-2024__location">
            <span class="ticketSalesCard-2024__place">マリンメッセ福岡Ａ館</span>
            (<span class="ticketSalesCard-2024__address"><span class="ticketSalesCard-2024__region">福岡県</span></span>)
          </p>
        </li>
        <li class="ticketSalesList-2024__item">
          <p class="ticketSalesCard-2024__date">
            <span class="ticketSalesCard-2024__startDate"><time itemprop="startDate" datetime="2026-06-06T00:00:00+09:00"></time></span>
            <span class="ticketSalesCard-2024__endDate"><time itemprop="endDate" datetime="2026-06-07T00:00:00+09:00"></time></span>
          </p>
          <p class="ticketSalesCard-2024__location">
            <span class="ticketSalesCard-2024__place">真駒内セキスイハイムアイスアリーナ</span>
            (<span class="ticketSalesCard-2024__address"><span class="ticketSalesCard-2024__region">北海道</span></span>)
          </p>
        </li>
      </body>
    </html>
  `;

  const events = mod.extractTicketPiaLocalSiteRuleEvents({
    source,
    url: "https://t.pia.jp/pia/event/event.do?eventBundleCd=b2563621",
    html
  });

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].start_date, "2026-06-06");
  assert.strictEqual(events[0].end_date, "2026-06-07");
  assert.strictEqual(events[0].venue, "真駒内セキスイハイムアイスアリーナ (北海道)");
}

async function testAllowKnownSapporoVenueWithoutCityName() {
  const mod = await loadModule();
  const ev = {
    title: "SUPER BEAVER 20th Anniversary TOUR 2026",
    venue: "北海道立総合体育センター 北海きたえーる",
    venue_address: ""
  };
  assert.strictEqual(mod.isSapporoAreaEvent(ev), true);
}

async function testBuildWessEventFromApiPost() {
  const mod = await loadModule();
  const source = {
    id: "wess-jp-concert-schedule",
    name: "WESS",
    url: "https://wess.jp/concert-schedule/",
    category: "コンサートプロモーター",
    priority: "S"
  };
  const post = {
    title: "SUPER BEAVER|03.08(日)|札幌 北海道立総合体育センター 北海きたえーる",
    link: "https://wess.jp/superbeaver2/",
    meta: {
      kouenbi: "20260308",
      artist: "SUPER BEAVER",
      concerttitle: "SUPER BEAVER 20th Anniversary 「都会のラクダ TOUR 2026 〜 ラクダトゥインクルー 〜」",
      kaijo: "北海道立総合体育センター 北海きたえーる",
      kaijojikan: "16:00",
      kaienjikan: "17:00",
      thumbnail_url: "https://wess.jp/example.jpg",
      freeareaahonbun: "<p>札幌公演です</p>"
    }
  };

  const ev = mod.eventFromWessPost(post, source);
  assert.ok(ev);
  assert.strictEqual(ev.start_date, "2026-03-08");
  assert.strictEqual(ev.title.includes("SUPER BEAVER"), true);
  assert.strictEqual(ev.venue, "北海道立総合体育センター 北海きたえーる");
  assert.strictEqual(ev.open_time, "16:00");
  assert.strictEqual(ev.start_time, "17:00");
}

async function testParseArgsSupportsTodayAndSource() {
  const mod = await loadModule();
  const args = mod.parseArgs([
    "--mode=full",
    "--today=2026-07-01",
    "--source=wess-jp-concert-schedule,spice-sapporo-jp-schedule",
    "--output=tmp/events.json"
  ]);
  assert.strictEqual(args.mode, "full");
  assert.strictEqual(args.today, "2026-07-01");
  assert.deepStrictEqual(args.sourceIds, ["wess-jp-concert-schedule", "spice-sapporo-jp-schedule"]);
  assert.strictEqual(args.outputPath.endsWith(path.join("tmp", "events.json")), true);
}

async function testExtractHbcConcertEventsFiltersToSapporoArea() {
  const mod = await loadModule();
  const source = { id: "www-hbc-co-jp-event", name: "HBC", url: "https://www.hbc.co.jp/event/", priority: "A" };
  const html = `
    <table><tbody>
      <tr>
        <th><a href="https://example.com/a">札幌公演A</a></th>
        <td data-label="日程">4月4日(土)</td>
        <td data-label="時間">13:00開場/13:30開演</td>
        <td data-label="場所">札幌文化芸術劇場 hitaru</td>
        <td data-label="お問い合わせ">HBC</td>
        <td data-label="備考">販売中</td>
      </tr>
      <tr>
        <th rowspan="2"><a href="https://example.com/b">北海道ツアー</a></th>
        <td data-label="日程">5月13日(水)</td>
        <td data-label="時間">18:00開場/18:30開演</td>
        <td data-label="場所">北見市民会館</td>
        <td data-label="お問い合わせ" rowspan="2">HBC</td>
        <td data-label="備考" rowspan="2">販売中</td>
      </tr>
      <tr>
        <td data-label="日程">5月21日(木)</td>
        <td data-label="時間">14:00開場/14:30開演</td>
        <td data-label="場所">カナモトホール</td>
      </tr>
    </tbody></table>
  `;
  const events = mod.extractHbcConcertEvents({
    source,
    url: "https://www.hbc.co.jp/event/concert/index.html",
    html,
    nowYmd: "2026-03-08"
  });
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].venue, "札幌文化芸術劇場 hitaru");
  assert.strictEqual(events[1].venue, "カナモトホール");
}

async function testExtractKyobunScheduleEventsBuildsHallVenue() {
  const mod = await loadModule();
  const source = { id: "www-kyobun-org-event-schedule-html", name: "教文", url: "https://www.kyobun.org/event_schedule.html", priority: "A" };
  const html = `
    <dl class="schedule_all">
      <dt class="date">2026年3月8日（日）</dt>
      <dd class="event_link">
        <div class="event_text">
          <p class="icon mainhall">大ホール</p>
          <p class="title"><a href="event_schedule.html?id=11816&k=lst&ym=202603">札幌北野少年少女合唱団35周年記念コンサート</a></p>
          <p class="time">【開場】14:30 【開演】15:00</p>
        </div>
      </dd>
    </dl>
  `;
  const events = mod.extractKyobunScheduleEvents({
    source,
    url: "https://www.kyobun.org/event_schedule.html?k=lst&ym=202603",
    html,
    nowYmd: "2026-03-08"
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].venue, "札幌市教育文化会館 大ホール");
  assert.strictEqual(events[0].start_time, "15:00");
}

async function testExtractJetroJmesseHandlesZeroPaddedDates() {
  const mod = await loadModule();
  const source = { id: "www-jetro-go-jp-j-messe-country-asia-jp-001", name: "JETRO", url: "https://www.jetro.go.jp/j-messe/country/asia/jp/001/", priority: "A" };
  const html = `
    <ul class="var_border_bottom var_blocklink">
      <li>
        <a href="/j-messe/tradefair/detail/158950">
          <p class="font18 font_bold">北海道 エネルギー技術革新EXPO 2026</p>
          <div class="elem_text_list_note">
            <dl class="w80">
              <dt>会期</dt><dd>2026年10月07日～2026年10月08日</dd>
              <dt>開催地</dt><dd>札幌 （北海道） / 日本 / アジア</dd>
            </dl>
          </div>
        </a>
      </li>
    </ul>
  `;
  const events = mod.extractJetroJmesseSiteRuleEvents({
    source,
    url: source.url,
    html,
    nowYmd: "2026-04-01"
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].start_date, "2026-10-07");
}

async function testExtractSapporoShiminhallScheduleEventsFromMonthlyPage() {
  const mod = await loadModule();
  const source = { id: "www-sapporo-shiminhall-org", name: "カナモトホール", url: "https://www.sapporo-shiminhall.org/", priority: "A" };
  const html = `
    <main>
      <span id="year"><span>2026</span>年</span>
      <span id="month"><span>04</span>月</span>
      <tr id="event2044-2">
        <td class="tbody-date"><div class="s-date"><p class="day">2</p><p class="week">木</p></div></td>
        <td class="tbody01">社会風刺コント集団 ザ・ニュースペーパー</td>
        <td class="tbody02 tb-label" data-label="開場"><p>1回目 <span class='time'>12:30</span></p></td>
        <td class="tbody03 tb-label" data-label="開演"><p><span class='fwb'>13:00</span></p></td>
        <td class="tbody04 tb-label" data-label="お問合せ先"><p>株式会社トラスト企画クリエート</p></td>
      </tr>
    </main>
  `;
  const events = mod.extractSapporoShiminhallScheduleEvents({
    source,
    url: "https://www.sapporo-shiminhall.org/event/?ymd=2026/04/01",
    html,
    nowYmd: "2026-04-01"
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].start_date, "2026-04-02");
  assert.strictEqual(events[0].venue, "カナモトホール");
}

async function testExtractChieriaHallScheduleEventsFromCalendarView() {
  const mod = await loadModule();
  const source = { id: "chieria-slp-or-jp-schedule", name: "ちえりあ", url: "https://chieria.slp.or.jp/schedule/", priority: "A" };
  const html = `
    <table>
      <tr>
        <th scope="rows"><p>4月29日（水曜日）</p></th>
        <td>遠回りしてDiveする オモテもウラも抱きしめて 昭和レディ・心 [13時半開場：14時00分～]</td>
      </tr>
    </table>
  `;
  const events = mod.extractChieriaHallScheduleEvents({
    source,
    url: "https://chieria.slp.or.jp/_wcv/calendar/viewcal/QWQWlO/202604.html",
    html,
    nowYmd: "2026-04-01"
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].start_date, "2026-04-29");
  assert.strictEqual(events[0].venue, "札幌市生涯学習センター ちえりあホール");
}

async function testExtractSnowfesSiteRuleEvent() {
  const mod = await loadModule();
  const source = { id: "www-snowfes-com", name: "雪まつり", url: "https://www.snowfes.com/", priority: "S" };
  const html = `<html><body>次回は2027年2月4日（木）～2月11日（木・祝）で開催予定です。</body></html>`;
  const ev = mod.extractSnowfesSiteRuleEvent({ source, url: source.url, html, nowYmd: "2026-03-08" });
  assert.ok(ev);
  assert.strictEqual(ev.start_date, "2027-02-04");
  assert.strictEqual(ev.end_date, "2027-02-11");
}

async function testExtractYosakoiSiteRuleEvent() {
  const mod = await loadModule();
  const source = { id: "www-yosakoi-soran-jp", name: "YOSAKOI", url: "https://www.yosakoi-soran.jp/", priority: "S" };
  const html = `<html><body>2026年 第35回YOSAKOIソーラン祭り 6月10日(水)～14日(日)開催！</body></html>`;
  const ev = mod.extractYosakoiSiteRuleEvent({ source, url: source.url, html, nowYmd: "2026-03-08" });
  assert.ok(ev);
  assert.strictEqual(ev.start_date, "2026-06-10");
  assert.strictEqual(ev.end_date, "2026-06-14");
}

async function runTests() {
  const tests = [
    ["札幌圏会場は通す", testAllowSapporoAreaVenue],
    ["札幌圏外会場は落とす", testRejectOutsideAreaVenue],
    ["札幌文字列ノイズでは通さない", testRejectOutsideAreaWithLocalNoiseAddress],
    ["複数都市まとめ会場は落とす", testRejectMultiLocationListing],
    ["タイトルだけ札幌は通さない", testRejectTitleOnlyLocalWithoutVenueProof],
    ["ぴあ bundle は札幌カードの日付を使う", testExtractTicketPiaLocalCardDate],
    ["札幌既知会場は地名なしでも通す", testAllowKnownSapporoVenueWithoutCityName],
    ["WESS API から札幌公演を組み立てる", testBuildWessEventFromApiPost],
    ["CLI 引数で未来日と対象ソースを指定できる", testParseArgsSupportsTodayAndSource],
    ["HBC 一覧は札幌圏会場だけ拾う", testExtractHbcConcertEventsFiltersToSapporoArea],
    ["教文一覧はホール情報付きで組み立てる", testExtractKyobunScheduleEventsBuildsHallVenue],
    ["JETRO 一覧はゼロ埋め日付を正しく拾う", testExtractJetroJmesseHandlesZeroPaddedDates],
    ["カナモトホール月別ページを組み立てる", testExtractSapporoShiminhallScheduleEventsFromMonthlyPage],
    ["ちえりあカレンダーHTMLを組み立てる", testExtractChieriaHallScheduleEventsFromCalendarView],
    ["雪まつりの次回会期を拾う", testExtractSnowfesSiteRuleEvent],
    ["YOSAKOIの開催日を拾う", testExtractYosakoiSiteRuleEvent]
  ];
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`PASS: ${name}`);
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err && err.stack ? err.stack : err);
      process.exitCode = 1;
      break;
    }
  }
  if (passed === tests.length) {
    console.log(`OK: ${passed} tests passed.`);
  }
}

runTests();
