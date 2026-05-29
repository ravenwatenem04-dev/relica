import SwiftUI

struct AgentStatusBadge: View {
    let status: AgentStatus

    var color: Color {
        switch status {
        case .running:
            return .green
        case .available:
            return .blue
        case .disabled:
            return .gray
        case .blocked:
            return .red
        }
    }

    var label: String {
        switch status {
        case .running:
            return "Running"
        case .available:
            return "Idle"
        case .disabled:
            return "Offline"
        case .blocked:
            return "Error"
        }
    }

    var body: some View {
        Text(label)
            .font(.caption)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
                Capsule()
                    .fill(color.opacity(0.15))
            )
    }
}
