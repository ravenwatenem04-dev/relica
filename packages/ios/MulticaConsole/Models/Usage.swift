import Foundation

struct UsageSummary: Codable {
    struct Period: Codable {
        let from: String
        let to: String
    }

    let period: Period
    let totalRuns: Int
    let successfulRuns: Int
    let failedRuns: Int
    let totalTokens: TokenUsage?
    let estimatedCost: Double?
    let agentBreakdown: [TopAgent]
    let dailyTrend: [DailyUsage]?
    let dataAvailable: Bool
}

struct TopAgent: Codable, Identifiable {
    var id: String { agentId }
    let agentId: String
    let agentName: String
    let runCount: Int
    let successRate: Double
    let totalTokens: TokenUsage?
    let estimatedCost: Double?
}

struct DailyUsage: Codable {
    let date: String
    let runCount: Int
    let cost: Double
}
