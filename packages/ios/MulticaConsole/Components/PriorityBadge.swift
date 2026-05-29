import SwiftUI

struct PriorityBadge: View {
    let priority: String?

    private var level: PriorityLevel {
        PriorityLevel(rawValue: (priority ?? "").lowercased()) ?? .none
    }

    private var color: Color {
        switch level {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .critical: return .red
        case .none: return .gray
        }
    }

    private var label: String {
        level == .none ? "" : level.rawValue.capitalized
    }

    var body: some View {
        if level != .none {
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundColor(color)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(color.opacity(0.15))
                .clipShape(Capsule())
        }
    }
}
