import SwiftUI

struct AgentStatusBadge: View {
    let status: String

    var color: Color {
        switch status.lowercased() {
        case "running": return .green
        case "idle": return .blue
        case "offline": return .gray
        case "error": return .red
        default: return .gray
        }
    }

    var body: some View {
        Text(status.capitalized)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.gradient)
            .clipShape(Capsule())
    }
}
