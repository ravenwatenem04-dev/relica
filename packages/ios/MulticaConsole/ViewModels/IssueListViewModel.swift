import Observation
import Foundation

@Observable
@MainActor
final class IssueListViewModel {
    var issues: [Issue] = []
    var isLoading = false
    var isLoadingMore = false
    var error: String?
    var hasMore = true
    var total = 0

    var searchText = ""
    var filterStatus: Set<IssueStatus> = []
    var filterPriority: String?
    var filterProject: String?
    var isFilterPresented = false

    private var currentOffset = 0
    private let pageSize = 50

    var filteredIssues: [Issue] {
        var result = issues
        if !searchText.isEmpty {
            result = result.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
        }
        if !filterStatus.isEmpty {
            result = result.filter { filterStatus.contains($0.status) }
        }
        if let priority = filterPriority {
            result = result.filter { $0.priority?.lowercased() == priority.lowercased() }
        }
        if let project = filterProject {
            result = result.filter { $0.projectId == project }
        }
        return result
    }

    var hasActiveFilters: Bool {
        !filterStatus.isEmpty || filterPriority != nil || filterProject != nil
    }

    func loadIssues() async {
        guard !isLoading else { return }
        isLoading = true
        error = nil
        currentOffset = 0

        do {
            let response = try await APIClient.shared.listIssues(
                limit: pageSize,
                offset: 0
            )
            issues = response.issues
            total = response.total
            hasMore = response.hasMore
            currentOffset = issues.count
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadMore() async {
        guard !isLoadingMore, hasMore else { return }
        isLoadingMore = true

        do {
            let response = try await APIClient.shared.listIssues(
                limit: pageSize,
                offset: currentOffset
            )
            issues.append(contentsOf: response.issues)
            total = response.total
            hasMore = response.hasMore
            currentOffset = issues.count
        } catch {
            self.error = error.localizedDescription
        }

        isLoadingMore = false
    }

    func refresh() async {
        await loadIssues()
    }

    func clearFilters() {
        filterStatus = []
        filterPriority = nil
        filterProject = nil
    }
}
