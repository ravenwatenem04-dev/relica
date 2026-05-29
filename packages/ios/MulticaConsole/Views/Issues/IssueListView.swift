import SwiftUI

struct IssueListView: View {
    @State private var viewModel = IssueListViewModel()
    @State private var isCreatePresented = false

    var body: some View {
        NavigationStack {
            List {
                if viewModel.isLoading && viewModel.issues.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, alignment: .center)
                        .listRowSeparator(.hidden)
                } else if let error = viewModel.error, viewModel.issues.isEmpty {
                    ContentUnavailableView(
                        "Failed to Load",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                    .listRowSeparator(.hidden)
                } else if viewModel.filteredIssues.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView(
                        "No Issues",
                        systemImage: "tray",
                        description: Text(viewModel.hasActiveFilters ? "Try adjusting your filters" : "No issues found")
                    )
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(viewModel.filteredIssues) { issue in
                        NavigationLink(destination: IssueDetailView(issueId: issue.id)) {
                            IssueRow(issue: issue)
                        }
                    }

                    if viewModel.hasMore {
                        Button {
                            Task { await viewModel.loadMore() }
                        } label: {
                            HStack {
                                Spacer()
                                if viewModel.isLoadingMore {
                                    ProgressView()
                                } else {
                                    Text("Load More")
                                        .font(.subheadline)
                                }
                                Spacer()
                            }
                        }
                        .disabled(viewModel.isLoadingMore)
                        .listRowSeparator(.hidden)
                    }
                }
            }
            .listStyle(.plain)
            .searchable(text: $viewModel.searchText, prompt: "Search issues")
            .refreshable {
                await viewModel.refresh()
            }
            .navigationTitle("Issues")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        Button {
                            viewModel.isFilterPresented = true
                        } label: {
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                                .symbolVariant(viewModel.hasActiveFilters ? .fill : .none)
                        }

                        Button {
                            isCreatePresented = true
                        } label: {
                            Label("New Issue", systemImage: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $viewModel.isFilterPresented) {
                IssueFiltersSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $isCreatePresented) {
                CreateIssueView {
                    Task { await viewModel.refresh() }
                }
            }
            .task {
                await viewModel.loadIssues()
            }
        }
    }
}
