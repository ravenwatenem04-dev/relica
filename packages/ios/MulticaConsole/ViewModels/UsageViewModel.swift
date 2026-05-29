import Foundation
import Observation

@Observable
@MainActor
final class UsageViewModel {
    private(set) var summary: UsageSummary?
    private(set) var isLoading = false
    private(set) var error: String?
    private(set) var selectedPeriod = "30d"

    let periods = ["7d", "30d", "90d"]

    func fetchSummary() async {
        isLoading = true
        error = nil

        do {
            summary = try await APIClient.shared.usageSummary(period: selectedPeriod)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func selectPeriod(_ period: String) {
        selectedPeriod = period
        Task { await fetchSummary() }
    }
}
