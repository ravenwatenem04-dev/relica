import SwiftUI

struct UsageSummaryView: View {
    @State private var viewModel = UsageViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Usage Summary")
                    .font(.title2.weight(.semibold))

                summaryCards

                Picker("Period", selection: periodBinding) {
                    ForEach(UsageViewModel.Period.allCases) { period in
                        Text(period.title).tag(period)
                    }
                }
                .pickerStyle(.segmented)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Top Agents")
                        .font(.headline)

                    if viewModel.topAgents.isEmpty {
                        Text("N/A")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.topAgents) { agent in
                            HStack {
                                Text(agent.agentName.isEmpty ? "N/A" : agent.agentName)
                                Spacer()
                                Text("\(agent.runCount)")
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 6)
                            Divider()
                        }
                    }
                }
                .padding()
                .background { cardContainer }

                Link("View full analytics on web", destination: URL(string: "https://app.multica.ai")!)
                    .font(.subheadline.weight(.medium))
            }
            .padding()
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
        .task {
            await viewModel.fetchUsageSummary()
        }
        .alert("Unable to load usage data", isPresented: errorBinding) {
            Button("OK", role: .cancel) { viewModel.errorMessage = nil }
        }
    }

    private var summaryCards: some View {
        HStack(spacing: 12) {
            metricCard(
                title: "Total Runs",
                value: viewModel.totalRuns.map(String.init) ?? "N/A",
                icon: "chart.bar.fill"
            )
            metricCard(
                title: "Success Rate",
                value: formattedSuccessRate(viewModel.successRate),
                icon: "checkmark.seal.fill"
            )
            metricCard(
                title: "Est. Cost",
                value: formattedCost(viewModel.estimatedCost),
                icon: "dollarsign.circle.fill"
            )
        }
    }

    private func metricCard(title: String, value: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(.blue)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background { cardContainer }
    }

    private var cardContainer: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(Color(.secondarySystemBackground))
            .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 2)
    }

    private var periodBinding: Binding<UsageViewModel.Period> {
        Binding(
            get: { viewModel.selectedPeriod },
            set: { period in
                Task { await viewModel.onPeriodChanged(period) }
            }
        )
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { viewModel.errorMessage != nil },
            set: { newValue in
                if !newValue {
                    viewModel.errorMessage = nil
                }
            }
        )
    }

    private func formattedSuccessRate(_ value: Double?) -> String {
        guard let value else { return "N/A" }
        return "\(Int((value * 100).rounded()))%"
    }

    private func formattedCost(_ value: Double?) -> String {
        guard let value else { return "N/A" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "$%.2f", value)
    }
}
