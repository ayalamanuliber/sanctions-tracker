"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

import styles from "./AnalyticsGrowthChart.module.css";

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type GrowthPoint = {
  value: string;
  newCount: number;
  cumulative: number;
};

function monthLabel(value: string, short = false) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: short ? "2-digit" : "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default function AnalyticsGrowthChart({
  points,
  compact = false,
}: {
  points: GrowthPoint[];
  compact?: boolean;
}) {
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"combined" | "new">("combined");
  const visible = useMemo(() => {
    if (!compact || points.length <= 48) return points;
    return points.slice(-48);
  }, [compact, points]);

  useEffect(() => {
    if (!chartRef.current) return;
    const isNarrow = chartRef.current.clientWidth < 440;
    const chart = echarts.init(chartRef.current, undefined, {
      renderer: "canvas",
    });
    const option: EChartsCoreOption = {
      animationDuration: 450,
      color: ["#2f73dc", "#b7d3f7"],
      grid: {
        left: isNarrow ? 38 : 48,
        right: isNarrow ? 14 : 22,
        top: 38,
        bottom: compact ? 34 : 54,
      },
      legend: {
        top: 4,
        right: 4,
        textStyle: { color: "#607087", fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "#7f96b2", type: "dashed" } },
        backgroundColor: "#071c37",
        borderWidth: 0,
        textStyle: { color: "#fff", fontSize: 12 },
        formatter: (raw: unknown) => {
          const entries = raw as Array<{
            axisValue: string;
            marker: string;
            seriesName: string;
            value: number;
          }>;
          if (!entries.length) return "";
          return [
            `<strong>${monthLabel(entries[0].axisValue)}</strong>`,
            ...entries.map(
              (entry) =>
                `${entry.marker}${entry.seriesName}: <b>${Number(entry.value).toLocaleString()}</b>`,
            ),
            entries[0].axisValue === visible.at(-1)?.value
              ? '<span style="color:#f4c469">Latest recorded period may be incomplete</span>'
              : '<span style="opacity:.72">Click to inspect records</span>',
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: true,
        data: visible.map((point) => point.value),
        axisLabel: {
          color: "#718096",
          fontSize: 10,
          interval: isNarrow
            ? (index: number, value: string) =>
                index === 0 ||
                index === visible.length - 1 ||
                value.endsWith("-01")
            : compact
              ? 11
              : Math.max(0, Math.floor(visible.length / 10)),
          formatter: (value: string) => monthLabel(value, true),
        },
        axisLine: { lineStyle: { color: "#d9e2ee" } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: mode === "new" ? "New matters" : "Cumulative matters",
          nameTextStyle: { color: "#7a8798", fontSize: 10 },
          axisLabel: { color: "#718096", fontSize: 10 },
          splitLine: { lineStyle: { color: "#e8eef5" } },
        },
        {
          type: "value",
          show: mode === "combined",
          axisLabel: { color: "#93a0b0", fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      dataZoom:
        compact || visible.length < 30
          ? []
          : [
              {
                type: "inside",
                start: Math.max(0, 100 - (48 / visible.length) * 100),
                end: 100,
              },
              {
                type: "slider",
                height: 14,
                bottom: 4,
                borderColor: "transparent",
                fillerColor: "rgba(47,115,220,.16)",
                handleSize: 0,
                showDetail: false,
              },
            ],
      series:
        mode === "new"
          ? [
              {
                name: "New matters",
                type: "bar",
                data: visible.map((point, index) => ({
                  value: point.newCount,
                  itemStyle: {
                    color: index === visible.length - 1 ? "#8fb7eb" : "#2f73dc",
                    opacity: index === visible.length - 1 ? 0.7 : 1,
                  },
                })),
                itemStyle: { color: "#2f73dc", borderRadius: [3, 3, 0, 0] },
                emphasis: { itemStyle: { color: "#f0a51b" } },
              },
            ]
          : [
              {
                name: "New matters",
                type: "bar",
                yAxisIndex: 1,
                data: visible.map((point, index) => ({
                  value: point.newCount,
                  itemStyle: {
                    color: index === visible.length - 1 ? "#e4edf9" : "#c9dcf7",
                    opacity: index === visible.length - 1 ? 0.72 : 1,
                  },
                })),
                itemStyle: { color: "#c9dcf7", borderRadius: [2, 2, 0, 0] },
                emphasis: { itemStyle: { color: "#f0b84d" } },
              },
              {
                name: "Cumulative",
                type: "line",
                smooth: 0.18,
                symbolSize: 5,
                data: visible.map((point) => point.cumulative),
                lineStyle: { width: 3, color: "#2f73dc" },
                itemStyle: { color: "#fff", borderColor: "#2f73dc", borderWidth: 2 },
                areaStyle: { color: "rgba(47,115,220,.09)" },
              },
            ],
    };
    chart.setOption(option);
    chart.on("click", (event) => {
      const period = String(event.name || "");
      if (!/^\d{4}-\d{2}$/.test(period)) return;
      const [year, month] = period.split("-").map(Number);
      const from = `${period}-01`;
      const to = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
      router.push(`/analytics?view=explore&from=${from}&to=${to}`);
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [mode, router, visible, compact]);

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""}`}>
      <div className={styles.controls} aria-label="Chart view">
        <span>View</span>
        <button
          className={mode === "combined" ? styles.active : ""}
          onClick={() => setMode("combined")}
          aria-pressed={mode === "combined"}
          type="button"
        >
          Cumulative + new
        </button>
        <button
          className={mode === "new" ? styles.active : ""}
          onClick={() => setMode("new")}
          aria-pressed={mode === "new"}
          type="button"
        >
          New matters only
        </button>
      </div>
      <div className={styles.chart} ref={chartRef} />
      <p>
        Decision month. Corpus-added dates are not recorded. The latest period
        may be incomplete. Hover for values; click a period to inspect records.
      </p>
    </div>
  );
}
