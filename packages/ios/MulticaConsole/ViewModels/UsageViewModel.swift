import Foundation
import Observation

@Observable
final class UsageViewModel {
    enum Period: String, CaseIterable, Identifiable {
        case sevenDays = "7d"
        case thirtyDays = "30d"
        case ninetyDays = "90d"

        var id: String { rawValue }
        var title: String { rawValue }
    }

    struct AgentSummary: Decodable, Identifiable {
        let agentName: String
        let runCount: Int

        var id: String { agentName }
    }

    private struct UsageSummaryResponse: Decodable {
        let totalRuns: Int?
        let successfulRuns: Int?
        let failedRuns: Int?
        let estimatedCost: Double?
        let agentBreakdown: [AgentSummary]?
    }

    var selectedPeriod: Period = .thirtyDays
    var isLoading = false
    var errorMessage: String?

    var totalRuns: Int?
    var successRate: Double?
    var estimatedCost: Double?
    var topAgents: [AgentSummary] = []

    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL = URL(string: "http://localhost:4000")!, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    @MainActor
    func onPeriodChanged(_ period: Period) async {
        selectedPeriod = period
        await fetchUsageSummary()
    }

    @MainActor
    func fetchUsageSummary() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let summary = try await loadSummary(period: selectedPeriod)
            totalRuns = summary.totalRuns
            estimatedCost = summary.estimatedCost
            topAgents = Array((summary.agentBreakdown ?? []).sorted(by: { $0.runCount > $1.runCount }).prefix(5))

            if let total = summary.totalRuns, total > 0, let success = summary.successfulRuns {
                successRate = Double(success) / Double(total)
            } else if let success = summary.successfulRuns, let failed = summary.failedRuns, success + failed > 0 {
                successRate = Double(success) / Double(success + failed)
            } else {
                successRate = nil
            }
        } catch {
            totalRuns = nil
            successRate = nil
            estimatedCost = nil
            topAgents = []
            errorMessage = "Unable to load usage data"
        }
    }

    private func loadSummary(period: Period) async throws -> UsageSummaryResponse {
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/usage/summary"), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "period", value: period.rawValue)]

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        let (data, response) = try await session.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(UsageSummaryResponse.self, from: data)
    }
}
