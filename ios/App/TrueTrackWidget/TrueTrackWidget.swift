import WidgetKit
import SwiftUI
struct WidgetData: Decodable {
    let monthlySpend: Double
    let monthlyBudget: Double
    let dailySpend: Double
    let lastUpdated: TimeInterval
}
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), data: loadData())
        completion(entry)
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let date = Date()
        let data = loadData()
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: date)!
        let entry = SimpleEntry(date: date, data: data)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    func loadData() -> WidgetData? {
        // Read from file "widget_data.json" in the App Group container
        if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.truetrack.app") {
            let fileURL = containerURL.appendingPathComponent("widget_data.json")
            if let jsonData = try? Data(contentsOf: fileURL) {
                return try? JSONDecoder().decode(WidgetData.self, from: jsonData)
            }
        }
        return nil
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct TrueTrackWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let data = entry.data {
                Text("TrueTrack")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                VStack(alignment: .leading) {
                    Text("This Month")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text("€\(String(format: "%.0f", data.monthlySpend))")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(data.monthlySpend > data.monthlyBudget ? .red : .primary)
                }
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("Budget")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        Text("€\(String(format: "%.0f", data.monthlyBudget))")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text("Today")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        Text("€\(String(format: "%.0f", data.dailySpend))")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                }
            } else {
                // Debug UI for File Access
                if let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.truetrack.app") {
                    let fileURL = container.appendingPathComponent("widget_data.json")
                    if FileManager.default.fileExists(atPath: fileURL.path) {
                        Text("File exists but decode failed").font(.caption2).foregroundColor(.orange)
                    } else {
                        Text("No data file found").font(.caption2).foregroundColor(.red)
                        Text(container.lastPathComponent).font(.system(size: 6)).foregroundColor(.gray)
                    }
                } else {
                    Text("Error: No App Group").font(.caption).foregroundColor(.red)
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(UIColor.systemBackground)
        }
    }
}
@main
struct TrueTrackWidget: Widget {
    let kind: String = "TrueTrackWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TrueTrackWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("TrueTrack Stats")
        .description("View your spending at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
