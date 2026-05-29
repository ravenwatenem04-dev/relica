import SwiftUI

struct StatusPicker: View {
    @Binding var selectedStatus: IssueStatus

    var body: some View {
        Picker("Status", selection: $selectedStatus) {
            ForEach(IssueStatus.allCases, id: \.self) { status in
                HStack {
                    Image(systemName: status.systemImage)
                    Text(status.displayName)
                }
                .tag(status)
            }
        }
        .pickerStyle(.wheel)
    }
}

struct StatusPickerLabel: View {
    let status: IssueStatus

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: status.systemImage)
                .foregroundColor(statusColor)
            Text(status.displayName)
                .font(.subheadline.weight(.medium))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(statusColor.opacity(0.12))
        .clipShape(Capsule())
    }

    private var statusColor: Color {
        switch status {
        case .todo: return .gray
        case .inProgress: return .blue
        case .inReview: return .purple
        case .done: return .green
        case .blocked: return .red
        case .backlog: return .gray.opacity(0.5)
        case .cancelled: return .gray.opacity(0.5)
        }
    }
}
