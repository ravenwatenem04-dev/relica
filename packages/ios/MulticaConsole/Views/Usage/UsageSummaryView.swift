import SwiftUI

struct UsageSummaryView: View {
    @State private var viewModel = UsageViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    periodPicker
                    summaryCards
                    topAgentsSection
                    webAnalyticsLink
                }
                .padding()
            }
            .navigationTitle("Usage Summary")
        }
        .task {
            await viewModel.loadSummary()
        }
    }

    private var periodPicker: some View {
        Picker("Period", selection: Binding(
            get: { viewModel.selectedPeriod },
            set: { newValue in
                Task { await viewModel.updatePeriod(newValue) }
            }
        )) {
            Text("7d").tag(UsagePeriod.sevenDays)
            Text("30d").tag(UsagePeriod.thirtyDays)
            Text("90d").tag(UsagePeriod.ninetyDays)
        }
        .pickerStyle(.segmented)
    }

    private var summaryCards: some View {
        Group {
            if viewModel.isLoading && viewModel.summary == nil {
                ProgressView("Loading usage data...")
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
            } else if viewModel.error != nil && viewModel.summary == nil {
                Text("Unable to load usage data")
                    .foregroundStyle(.red)
            } else {
                VStack(spacing: 12) {
                    statCard(
                        title: "Total Runs",
                        value: valueOrNA(viewModel.summary?.totalRuns.map(String.init)),
                        icon: "play.circle.fill"
                    )
                    statCard(
                        title: "Success Rate",
                        value: formatPercent(viewModel.summary?.successRate),
                        icon: "checkmark.seal.fill"
                    )
                    statCard(
                        title: "Est. Cost",
                        value: formatCurrency(viewModel.summary?.estimatedCost),
                        icon: "dollarsign.circle.fill"
                    )
                }
            }
        }
    }

    private var topAgentsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Top Agents")
                .font(.headline)

            let topAgents = Array((viewModel.summary?.topAgents ?? []).prefix(5))

            if topAgents.isEmpty {
                Text("N/A")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(topAgents) { agent in
                    HStack {
                        Text(agent.agentName ?? "N/A")
                        Spacer()
                        Text(valueOrNA(agent.runCount.map(String.init)))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 6)
                }
            }
        }
    }

    private var webAnalyticsLink: some View {
        Link("View full analytics on web", destination: URL(string: "https://multica.ai")!)
            .font(.subheadline)
            .padding(.top, 4)
    }

    private func statCard(title: String, value: String, icon: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title3.weight(.semibold))
            }
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)
        )
    }

    private func formatPercent(_ value: Double?) -> String {
        guard let value else { return "N/A" }
        return String(format: "%.0f%%", value * 100)
    }

    private func formatCurrency(_ value: Double?) -> String {
        guard let value else { return "N/A" }
        return String(format: "$%.2f", value)
    }

    private func valueOrNA(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "N/A" }
        return value
    }
}
