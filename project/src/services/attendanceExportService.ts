import type {
  AttendanceStatus,
} from '../api/attendanceApi';

export type AttendanceExportPeriodType =
  | 'week'
  | 'month';

export interface AttendanceExportRow {
  lessonDate: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: AttendanceStatus | null;
  lateMinutes: number;
  comment: string;
}

export interface AttendanceExportReport {
  studentName: string;
  groupName: string;
  periodLabel: string;
  generatedAt: string;
  rows: AttendanceExportRow[];
}

export interface AttendanceDateRange {
  dateFrom: string;
  dateTo: string;
  label: string;
}

interface AttendanceExportSummary {
  totalLessons: number;
  markedLessons: number;
  present: number;
  remote: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number;
  percentage: number;
}

const STATUS_LABELS: Record<
  AttendanceStatus,
  string
> = {
  present: 'Присутствовал',
  remote: 'Присутствовал дистанционно',
  absent: 'Отсутствовал',
  late: 'Опоздал',
  excused: 'Уважительная причина',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatUtcDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-');
}

function parseLocalDate(value: string): Date {
  const [year, month, day] =
    value.split('-').map(Number);

  return new Date(
    Number.isFinite(year) ? year : 1970,
    Number.isFinite(month) ? month - 1 : 0,
    Number.isFinite(day) ? day : 1
  );
}

function formatDate(value: string): string {
  const date = parseLocalDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toIsoWeekInputValue(
  dateValue: string
): string {
  const [year, month, day] =
    dateValue.split('-').map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const dayNumber =
    date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() + 4 - dayNumber
  );

  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(
    Date.UTC(isoYear, 0, 1)
  );

  const weekNumber = Math.ceil(
    (
      (
        date.getTime() -
        yearStart.getTime()
      ) /
        86400000 +
      1
    ) /
      7
  );

  return `${isoYear}-W${pad(weekNumber)}`;
}

export function getCurrentIsoWeekValue(): string {
  const now = new Date();

  return toIsoWeekInputValue(
    [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join('-')
  );
}

export function getCurrentMonthValue(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
  ].join('-');
}

function getWeekRange(
  weekValue: string
): AttendanceDateRange {
  const match = /^([0-9]{4})-W([0-9]{2})$/.exec(
    weekValue
  );

  if (!match) {
    throw new Error('Выберите неделю для выгрузки');
  }

  const isoYear = Number(match[1]);
  const isoWeek = Number(match[2]);

  if (
    !Number.isInteger(isoYear) ||
    !Number.isInteger(isoWeek) ||
    isoWeek < 1 ||
    isoWeek > 53
  ) {
    throw new Error('Некорректно выбрана неделя');
  }

  const januaryFourth = new Date(
    Date.UTC(isoYear, 0, 4)
  );

  const januaryFourthDay =
    januaryFourth.getUTCDay() || 7;

  const monday = new Date(januaryFourth);

  monday.setUTCDate(
    januaryFourth.getUTCDate() -
      januaryFourthDay +
      1 +
      (isoWeek - 1) * 7
  );

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const dateFrom = formatUtcDate(monday);
  const dateTo = formatUtcDate(sunday);

  return {
    dateFrom,
    dateTo,
    label:
      `${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
  };
}

function getMonthRange(
  monthValue: string
): AttendanceDateRange {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(
    monthValue
  );

  if (!match) {
    throw new Error('Выберите месяц для выгрузки');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error('Некорректно выбран месяц');
  }

  const dateFrom =
    `${year}-${pad(month)}-01`;

  const lastDay = new Date(
    year,
    month,
    0
  ).getDate();

  const dateTo =
    `${year}-${pad(month)}-${pad(lastDay)}`;

  const monthName =
    new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1));

  return {
    dateFrom,
    dateTo,
    label:
      monthName.charAt(0).toUpperCase() +
      monthName.slice(1),
  };
}

export function getAttendanceDateRange(
  periodType: AttendanceExportPeriodType,
  value: string
): AttendanceDateRange {
  return periodType === 'week'
    ? getWeekRange(value)
    : getMonthRange(value);
}

function calculateSummary(
  rows: AttendanceExportRow[]
): AttendanceExportSummary {
  const present = rows.filter(
    (row) => row.status === 'present'
  ).length;

  const remote = rows.filter(
    (row) => row.status === 'remote'
  ).length;

  const absent = rows.filter(
    (row) => row.status === 'absent'
  ).length;

  const late = rows.filter(
    (row) => row.status === 'late'
  ).length;

  const excused = rows.filter(
    (row) => row.status === 'excused'
  ).length;

  const unmarked = rows.filter(
    (row) => row.status === null
  ).length;

  const countedLessons =
    present + remote + absent + late;

  const attendedLessons =
    present + remote + late;

  return {
    totalLessons: rows.length,
    markedLessons: rows.length - unmarked,
    present,
    remote,
    absent,
    late,
    excused,
    unmarked,
    percentage:
      countedLessons > 0
        ? Math.round(
            attendedLessons /
              countedLessons *
              100
          )
        : 0,
  };
}

function getStatusLabel(
  status: AttendanceStatus | null
): string {
  return status
    ? STATUS_LABELS[status]
    : 'Не отмечено';
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(value: unknown): string {
  return escapeXml(value);
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120) || 'посещаемость';
}

function getBaseFileName(
  report: AttendanceExportReport
): string {
  return sanitizeFileName(
    `Посещаемость_${report.studentName}_${report.periodLabel}`
  );
}

function createExcelCell(
  value: unknown,
  styleId = 'Cell'
): string {
  return (
    `<Cell ss:StyleID="${styleId}">` +
    `<Data ss:Type="String">${escapeXml(value)}</Data>` +
    '</Cell>'
  );
}

export function downloadAttendanceExcel(
  report: AttendanceExportReport
): void {
  const summary = calculateSummary(report.rows);

  const detailRows = report.rows.map(
    (row, index) =>
      '<Row>' +
      createExcelCell(index + 1, 'Center') +
      createExcelCell(formatDate(row.lessonDate), 'Center') +
      createExcelCell(
        `${row.startTime.slice(0, 5)}-${row.endTime.slice(0, 5)}`,
        'Center'
      ) +
      createExcelCell(row.topic || 'Без темы') +
      createExcelCell(getStatusLabel(row.status)) +
      createExcelCell(
        row.status === 'late'
          ? row.lateMinutes
          : '',
        'Center'
      ) +
      createExcelCell(row.comment) +
      '</Row>'
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
 xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="Center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Посещаемость">
  <Table>
   <Column ss:Width="35"/>
   <Column ss:Width="85"/>
   <Column ss:Width="90"/>
   <Column ss:Width="190"/>
   <Column ss:Width="150"/>
   <Column ss:Width="85"/>
   <Column ss:Width="220"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">Журнал посещаемости студента</Data></Cell>
   </Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Студент</Data></Cell><Cell ss:MergeAcross="5"><Data ss:Type="String">${escapeXml(report.studentName)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Группа</Data></Cell><Cell ss:MergeAcross="5"><Data ss:Type="String">${escapeXml(report.groupName)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Период</Data></Cell><Cell ss:MergeAcross="5"><Data ss:Type="String">${escapeXml(report.periodLabel)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Сформировано</Data></Cell><Cell ss:MergeAcross="5"><Data ss:Type="String">${escapeXml(formatDateTime(report.generatedAt))}</Data></Cell></Row>
   <Row/>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Всего занятий</Data></Cell><Cell><Data ss:Type="String">${summary.totalLessons}</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Посещаемость</Data></Cell><Cell><Data ss:Type="String">${summary.percentage}%</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Не отмечено</Data></Cell><Cell><Data ss:Type="String">${summary.unmarked}</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Очно</Data></Cell><Cell><Data ss:Type="String">${summary.present}</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Дистант</Data></Cell><Cell><Data ss:Type="String">${summary.remote}</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Опоздания</Data></Cell><Cell><Data ss:Type="String">${summary.late}</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Пропуски</Data></Cell><Cell><Data ss:Type="String">${summary.absent}</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Уважительные</Data></Cell><Cell><Data ss:Type="String">${summary.excused}</Data></Cell><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Отмечено</Data></Cell><Cell><Data ss:Type="String">${summary.markedLessons}</Data></Cell></Row>
   <Row/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">№</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Дата</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Время</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Занятие</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Статус</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Опоздание, мин.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Комментарий</Data></Cell>
   </Row>
   ${detailRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>10</SplitHorizontal>
   <TopRowBottomPane>10</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob(
    ['\ufeff', xml],
    {
      type:
        'application/vnd.ms-excel;charset=utf-8',
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${getBaseFileName(report)}.xls`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

export function renderAttendancePdf(
  report: AttendanceExportReport,
  printWindow: Window
): void {
  const summary = calculateSummary(report.rows);

  const rows = report.rows.map(
    (row, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td class="center">${escapeHtml(formatDate(row.lessonDate))}</td>
        <td class="center">${escapeHtml(row.startTime.slice(0, 5))}-${escapeHtml(row.endTime.slice(0, 5))}</td>
        <td>${escapeHtml(row.topic || 'Без темы')}</td>
        <td>${escapeHtml(getStatusLabel(row.status))}</td>
        <td class="center">${row.status === 'late' ? row.lateMinutes : ''}</td>
        <td>${escapeHtml(row.comment)}</td>
      </tr>
    `
  ).join('');

  const title = getBaseFileName(report);

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, sans-serif; font-size: 11px; }
    h1 { margin: 0 0 12px; font-size: 20px; text-align: center; }
    .meta { display: grid; grid-template-columns: 120px 1fr; gap: 5px 12px; margin-bottom: 14px; }
    .meta-label { font-weight: 700; }
    .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 14px 0; }
    .summary-item { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
    .summary-label { color: #6b7280; font-size: 9px; }
    .summary-value { margin-top: 4px; font-size: 15px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #9ca3af; padding: 6px; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #f3f4f6; font-weight: 700; text-align: center; }
    .center { text-align: center; }
    .footer { margin-top: 10px; color: #6b7280; font-size: 9px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Журнал посещаемости студента</h1>
  <div class="meta">
    <div class="meta-label">Студент:</div><div>${escapeHtml(report.studentName)}</div>
    <div class="meta-label">Группа:</div><div>${escapeHtml(report.groupName)}</div>
    <div class="meta-label">Период:</div><div>${escapeHtml(report.periodLabel)}</div>
    <div class="meta-label">Сформировано:</div><div>${escapeHtml(formatDateTime(report.generatedAt))}</div>
  </div>
  <div class="summary">
    <div class="summary-item"><div class="summary-label">Всего занятий</div><div class="summary-value">${summary.totalLessons}</div></div>
    <div class="summary-item"><div class="summary-label">Посещаемость</div><div class="summary-value">${summary.percentage}%</div></div>
    <div class="summary-item"><div class="summary-label">Очно</div><div class="summary-value">${summary.present}</div></div>
    <div class="summary-item"><div class="summary-label">Дистант</div><div class="summary-value">${summary.remote}</div></div>
    <div class="summary-item"><div class="summary-label">Опоздания</div><div class="summary-value">${summary.late}</div></div>
    <div class="summary-item"><div class="summary-label">Пропуски</div><div class="summary-value">${summary.absent}</div></div>
    <div class="summary-item"><div class="summary-label">Уважительные</div><div class="summary-value">${summary.excused}</div></div>
    <div class="summary-item"><div class="summary-label">Не отмечено</div><div class="summary-value">${summary.unmarked}</div></div>
  </div>
  <table>
    <colgroup>
      <col style="width:4%" />
      <col style="width:9%" />
      <col style="width:10%" />
      <col style="width:23%" />
      <col style="width:17%" />
      <col style="width:9%" />
      <col style="width:28%" />
    </colgroup>
    <thead>
      <tr><th>№</th><th>Дата</th><th>Время</th><th>Занятие</th><th>Статус</th><th>Опоздание, мин.</th><th>Комментарий</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Документ сформирован в системе «ВШП Студент».</div>
  <script>
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  <\/script>
</body>
</html>`;

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
