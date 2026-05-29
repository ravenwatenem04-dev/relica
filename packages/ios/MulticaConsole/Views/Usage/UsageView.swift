import SwiftUI

struct UsageView: View {
    @State private var viewModel = UsageViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.summary == nil {
                    ProgressView("Loading usage...")
                } else if let error = viewModel.error, viewModel.summary == nil {
                    ContentUnavailableView(
                        "Failed to Load",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                } else if let summary = viewModel.summary {
                    List {
                        periodPicker
                        overviewSection(summary: summary)
                        agentBreakdownSection(summary: summary)
                        if let trend = summary.dailyTrend {
                            dailyTrendSection(trend: trend)
                        }
                    }
                    .listStyle(.insetGrouped)
                } else {
                    ContentUnavailableView(
                        "No Usage Data",
                        systemImage: "chart.bar",
                        description: Text("Usage data will appear once agents start running.")
                    )
                }
            }
            .navigationTitle("Usage")
            .refreshable {
                await viewModel.fetchSummary()
            }
            .task {
                await viewModel.fetchSummary()
            }
        }
    }

    private var periodPicker: some View {
        Section("Period") {
            Picker("Period", selection: $viewModel.selectedPeriod) {
                ForEach(viewModel.periods, id: \.self) { period in
                    Text(periodLabel(period)).tag(period)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: viewModel.selectedPeriod) { _, newValue in
                viewModel.selectPeriod(newValue)
            }
        }
    }

    private func overviewSection(summary: UsageSummary) -> some View {
        Section("Overview") {
            LabeledContent("Total Runs", value: "\(summary.totalRuns)")
            LabeledContent("Successful", value: "\(summary.successfulRuns)")
            LabeledContent("Failed", value: "\(summary.failedRuns)")
            if let cost = summary.estimatedCost {
                LabeledContent("Estimated Cost", value: "$\(String(format: "%.2f", cost))")
            }
            if let tokens = summary.totalTokens {
                LabeledContent("Tokens Used", value: "\(tokens.input + tokens.output)")
            }
            LabeledContent("Period", value: "\(formatDate(summary.period.from)) - \(formatDate(summary.period.to))")
        }
    }

    private func agentBreakdownSection(summary: UsageSummary) -> some View {
        Section("Top Agents") {
            if summary.agentBreakdown.isEmpty {
                Text("No agent data")
                    .foregroundStyle(.tertiary)
            } else {
                ForEach(summary.agentBreakdown) { agent in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(agent.agentName)
                            .font(.subheadline.weight(.medium))
                        HStack {
                            Text("\(agent.runCount) runs")
                                .font(.caption)
                            Text("·")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                            Text("\(Int(agent.successRate * 100))% success")
                                .font(.caption)
                                .foregroundStyle(agent.successRate > 0.8 ? .green : .orange)
                            Spacer()
                            if let cost = agent.estimatedCost {
                                Text("$\(String(format: "%.2f", cost))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    private func dailyTrendSection(trend: [DailyUsage]) -> some View {
        Section("Daily Trend") {
            ForEach(trend.suffix(14).reversed(), id: \.date) { day in
                HStack {
                    Text(formatDateShort(day.date))
                        .font(.caption)
                        .frame(width: 60, alignment: .leading)
                    Text("\(day.runCount) runs")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("$\(String(format: "%.2f", day.cost))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func periodLabel(_ period: String) -> String {
        switch period {
        case "7d": return "7 Days"
        case "30d": return "30 Days"
        case "90d": return "90 Days"
        default: return period
        }
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) else {
            return iso
        }
        let display = DateFormatter()
        display.dateStyle = .medium
        return display.string(from: date)
    }

    private func formatDateShort(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) else {
            return iso
        }
        let display = DateFormatter()
        display.dateFormat = "MM/dd"
        return display.string(from: date)
    }
}
