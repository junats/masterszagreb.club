import WidgetKit
import SwiftUI
import Charts

struct CategorySpend: Decodable, Identifiable {
    let category: String
    let amount: Double
    let color: String
    
    var id: String { category }
    
    var swiftUIColor: Color {
        Color(hex: color) ?? .gray
    }
}

struct WidgetData: Decodable {
    // Spending
    let monthlySpend: Double
    let monthlyBudget: Double
    let dailySpend: Double
    let weeklySpend: Double?
    let budgetPercentage: Double?
    
    // Additional metrics
    let remainingBudget: Double?
    let daysLeftInMonth: Int?
    let averageDailySpend: Double?
    
    // Category breakdown
    let topCategories: [CategorySpend]?
    
    // Co-parenting
    let daysWithYou: Int
    let daysWithCoparent: Int
    let nextTransition: String
    
    // Premium / Insights
    let latestInsight: String?
    let proStatus: Bool?
    
    let lastUpdated: TimeInterval
    
    var safeWeeklySpend: Double {
        return weeklySpend ?? 0
    }
    
    var safeBudgetPercentage: Double {
        return budgetPercentage ?? (monthlyBudget > 0 ? (monthlySpend / monthlyBudget) * 100 : 0)
    }
    
    var safeTopCategories: [CategorySpend] {
        return topCategories ?? []
    }
    
    var safeRemainingBudget: Double {
        return remainingBudget ?? (monthlyBudget - monthlySpend)
    }
    
    var safeDaysLeftInMonth: Int {
        return daysLeftInMonth ?? 0
    }
    
    var safeAverageDailySpend: Double {
        return averageDailySpend ?? 0
    }
}

// Color extension for hex colors
extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
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
        
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: date)!
        let entry = SimpleEntry(date: date, data: data)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    func loadData() -> WidgetData? {
        if let userDefaults = UserDefaults(suiteName: "group.com.truetrack.app") {
            if let jsonString = userDefaults.string(forKey: "widgetData") {
                if let jsonData = jsonString.data(using: .utf8) {
                    return try? JSONDecoder().decode(WidgetData.self, from: jsonData)
                }
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
    @Environment(\.widgetFamily) var family

    var body: some View {
        if let data = entry.data {
            widgetContent(data: data)
                .containerBackground(for: .widget) {
                    LinearGradient(
                        colors: [
                            Color(red: 0.02, green: 0.05, blue: 0.15),
                            Color(red: 0.05, green: 0.08, blue: 0.18)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
        } else {
            placeholderView()
                .containerBackground(for: .widget) {
                    LinearGradient(
                        colors: [
                            Color(red: 0.02, green: 0.05, blue: 0.15),
                            Color(red: 0.05, green: 0.08, blue: 0.18)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
        }
    }
    
    @ViewBuilder
    func widgetContent(data: WidgetData) -> some View {
        if family == .systemLarge {
            largeWidgetContent(data: data)
        } else {
            smallMediumWidgetContent(data: data)
        }
    }
    
    @ViewBuilder
    func smallMediumWidgetContent(data: WidgetData) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 0.58, green: 0.47, blue: 0.98), Color(red: 0.45, green: 0.35, blue: 0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 8, height: 8)
                
                Text("This Month")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.7))
                    .textCase(.uppercase)
                    .tracking(0.5)
                
                Spacer()
                
                Text("\(Int(data.safeBudgetPercentage))%")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(data.safeBudgetPercentage > 100 ? Color(red: 0.94, green: 0.38, blue: 0.38) : Color(red: 0.58, green: 0.47, blue: 0.98))
            }
            .padding(.bottom, 8)
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("€\(String(format: "%.0f", data.monthlySpend))")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(data.monthlySpend > data.monthlyBudget ? Color(red: 0.94, green: 0.38, blue: 0.38) : .white)
                
                Text("/ €\(String(format: "%.0f", data.monthlyBudget))")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white.opacity(0.35))
            }
            .padding(.bottom, 10)
            
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.white.opacity(0.08))
                    .frame(height: 6)
                
                GeometryReader { geometry in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            LinearGradient(
                                colors: data.monthlySpend > data.monthlyBudget 
                                    ? [Color(red: 0.94, green: 0.38, blue: 0.38), Color(red: 0.85, green: 0.28, blue: 0.28)]
                                    : [Color(red: 0.58, green: 0.47, blue: 0.98), Color(red: 0.45, green: 0.35, blue: 0.85)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: min(CGFloat(data.safeBudgetPercentage / 100) * geometry.size.width, geometry.size.width), height: 6)
                        .shadow(color: (data.monthlySpend > data.monthlyBudget ? Color(red: 0.94, green: 0.38, blue: 0.38) : Color(red: 0.58, green: 0.47, blue: 0.98)).opacity(0.5), radius: 4, x: 0, y: 0)
                }
            }
            .frame(height: 6)
            .padding(.bottom, family == .systemMedium ? 14 : 12)
            
            HStack(spacing: family == .systemMedium ? 20 : 12) {
                StatItem(label: "Week", value: "€\(String(format: "%.0f", data.safeWeeklySpend))", icon: "calendar.badge.clock")
                StatItem(label: "Today", value: "€\(String(format: "%.0f", data.dailySpend))", icon: "clock.fill")
                
                if family == .systemMedium {
                    Spacer()
                }
            }
            .padding(.bottom, family == .systemMedium ? 14 : 0)
            
            if family == .systemMedium && (data.daysWithYou > 0 || data.daysWithCoparent > 0) {
                Divider()
                    .background(Color.white.opacity(0.08))
                    .padding(.bottom, 12)
                
                HStack(spacing: 6) {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(red: 0.58, green: 0.47, blue: 0.98), Color(red: 0.45, green: 0.35, blue: 0.85)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 8, height: 8)
                    
                    Text("Custody")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                        .textCase(.uppercase)
                        .tracking(0.5)
                    
                    Spacer()
                }
                .padding(.bottom, 8)
                
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("You")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                            .textCase(.uppercase)
                            .tracking(0.3)
                        Text("\(data.daysWithYou)d")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Co-parent")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                            .textCase(.uppercase)
                            .tracking(0.3)
                        Text("\(data.daysWithCoparent)d")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 3) {
                        Text("Next")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                            .textCase(.uppercase)
                            .tracking(0.3)
                        Text(data.nextTransition)
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.58, green: 0.47, blue: 0.98))
                    }
                }
            }
            
            Spacer()
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
    }
    
    @ViewBuilder
    func largeWidgetContent(data: WidgetData) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                // Left side - Spending info
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(red: 0.58, green: 0.47, blue: 0.98), Color(red: 0.45, green: 0.35, blue: 0.85)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 8, height: 8)
                        
                        Text("This Month")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white.opacity(0.6))
                            .textCase(.uppercase)
                            .tracking(0.5)
                        
                        Spacer()
                        
                        Text("\(Int(data.safeBudgetPercentage))%")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(data.safeBudgetPercentage > 100 ? Color(red: 0.94, green: 0.38, blue: 0.38) : Color(red: 0.58, green: 0.47, blue: 0.98))
                    }
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("€\(String(format: "%.0f", data.monthlySpend))")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(data.monthlySpend > data.monthlyBudget ? Color(red: 0.94, green: 0.38, blue: 0.38) : .white)
                        
                        Text("/ €\(String(format: "%.0f", data.monthlyBudget))")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.35))
                    }
                    
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.white.opacity(0.08))
                            .frame(height: 6)
                        
                        GeometryReader { geometry in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(
                                    LinearGradient(
                                        colors: data.monthlySpend > data.monthlyBudget 
                                            ? [Color(red: 0.94, green: 0.38, blue: 0.38), Color(red: 0.85, green: 0.28, blue: 0.28)]
                                            : [Color(red: 0.58, green: 0.47, blue: 0.98), Color(red: 0.45, green: 0.35, blue: 0.85)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: min(CGFloat(data.safeBudgetPercentage / 100) * geometry.size.width, geometry.size.width), height: 6)
                                .shadow(color: (data.monthlySpend > data.monthlyBudget ? Color(red: 0.94, green: 0.38, blue: 0.38) : Color(red: 0.58, green: 0.47, blue: 0.98)).opacity(0.5), radius: 4, x: 0, y: 0)
                        }
                    }
                    .frame(height: 6)
                    
                    VStack(spacing: 8) {
                        MiniStatItem(label: "Week", value: "€\(String(format: "%.0f", data.safeWeeklySpend))")
                        MiniStatItem(label: "Today", value: "€\(String(format: "%.0f", data.dailySpend))")
                    }
                    
                    if data.daysWithYou > 0 || data.daysWithCoparent > 0 {
                        Divider()
                            .background(Color.white.opacity(0.08))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Custody")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                                .textCase(.uppercase)
                                .tracking(0.5)
                            
                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("You")
                                        .font(.system(size: 9, weight: .medium))
                                        .foregroundColor(.white.opacity(0.5))
                                    Text("\(data.daysWithYou)d")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundColor(.white)
                                }
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Co-parent")
                                        .font(.system(size: 9, weight: .medium))
                                        .foregroundColor(.white.opacity(0.5))
                                    Text("\(data.daysWithCoparent)d")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundColor(.white)
                                }
                            }
                            
                            Text("Next: \(data.nextTransition)")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(Color(red: 0.58, green: 0.47, blue: 0.98))
                        }
                    }
                    
                    Spacer()
                }
                
                // Right side - Pie chart
                if !data.safeTopCategories.isEmpty {
                    VStack(alignment: .center, spacing: 8) {
                        Text("Categories")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white.opacity(0.6))
                            .textCase(.uppercase)
                            .tracking(0.5)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        Chart(data.safeTopCategories) { category in
                            SectorMark(
                                angle: .value("Amount", category.amount),
                                innerRadius: .ratio(0.5),
                                angularInset: 1.5
                            )
                            .foregroundStyle(by: .value("Category", category.category))
                        }
                        .chartForegroundStyleScale([
                            "Food": Color(red: 0.94, green: 0.27, blue: 0.27),
                            "Activities": Color(red: 0.96, green: 0.62, blue: 0.04),
                            "Education": Color(red: 0.23, green: 0.51, blue: 0.96),
                            "Health": Color(red: 0.06, green: 0.72, blue: 0.51),
                            "Clothing": Color(red: 0.55, green: 0.36, blue: 0.96),
                            "Transport": Color(red: 0.93, green: 0.28, blue: 0.57),
                            "Luxury": Color(red: 0.85, green: 0.55, blue: 0.26),
                            "Child": Color(red: 0.40, green: 0.76, blue: 0.65),
                            "Alcohol": Color(red: 0.76, green: 0.40, blue: 0.56),
                            "Dining": Color(red: 0.99, green: 0.71, blue: 0.42),
                            "Household": Color(red: 0.13, green: 0.83, blue: 0.93),
                            "Other": Color(red: 0.42, green: 0.45, blue: 0.50)
                        ])
                        .chartLegend(.hidden)
                        .frame(width: 120, height: 120)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(data.safeTopCategories.prefix(4)) { category in
                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(getCategoryColor(category.category))
                                        .frame(width: 6, height: 6)
                                    
                                    Text(category.category)
                                        .font(.system(size: 9, weight: .medium))
                                        .foregroundColor(.white.opacity(0.7))
                                    
                                    Spacer()
                                    
                                    Text("€\(String(format: "%.0f", category.amount))")
                                        .font(.system(size: 9, weight: .semibold, design: .rounded))
                                        .foregroundColor(.white.opacity(0.9))
                                }
                            }
                        }
                        
                        Divider().background(Color.white.opacity(0.05)).padding(.vertical, 6)
                        
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Left").font(.system(size: 8, weight: .medium)).foregroundColor(.white.opacity(0.4))
                                Text("€\(String(format: "%.0f", data.safeRemainingBudget))").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundColor(data.safeRemainingBudget < 0 ? Color(red: 0.94, green: 0.38, blue: 0.38) : Color(red: 0.06, green: 0.72, blue: 0.51))
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(data.safeDaysLeftInMonth)d left").font(.system(size: 8, weight: .medium)).foregroundColor(.white.opacity(0.4))
                                Text("€\(String(format: "%.0f", data.safeAverageDailySpend))/d").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundColor(.white.opacity(0.9))
                            }
                        }
                        
                        Spacer()
                    }
                }
            }
            
            // --- Premium Insight Footer (NEW) ---
            if let insight = data.latestInsight, data.proStatus == true {
                Spacer()
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.47, blue: 0.98))
                    Text(insight)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(1)
                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.white.opacity(0.08))
                .cornerRadius(8)
                .padding(.top, 12)
            }
        }
        .padding(10)
    }
    
    @ViewBuilder
    func placeholderView() -> some View {
        VStack(spacing: 10) {
            Image(systemName: "chart.bar.fill")
                .font(.system(size: 28))
                .foregroundColor(.white.opacity(0.25))
            Text("Open TrueTrack")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white.opacity(0.4))
        }
    }
    
    func getCategoryColor(_ category: String) -> Color {
        switch category {
        case "Food": return Color(red: 0.94, green: 0.27, blue: 0.27)
        case "Activities": return Color(red: 0.96, green: 0.62, blue: 0.04)
        case "Education": return Color(red: 0.23, green: 0.51, blue: 0.96)
        case "Health": return Color(red: 0.06, green: 0.72, blue: 0.51)
        case "Clothing": return Color(red: 0.55, green: 0.36, blue: 0.96)
        case "Transport": return Color(red: 0.93, green: 0.28, blue: 0.57)
        case "Luxury": return Color(red: 0.85, green: 0.55, blue: 0.26)
        case "Child": return Color(red: 0.40, green: 0.76, blue: 0.65)
        case "Alcohol": return Color(red: 0.76, green: 0.40, blue: 0.56)
        case "Dining": return Color(red: 0.99, green: 0.71, blue: 0.42)
        case "Household": return Color(red: 0.13, green: 0.83, blue: 0.93)
        default: return Color(red: 0.42, green: 0.45, blue: 0.50)
        }
    }
}

struct StatItem: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundColor(Color(red: 0.58, green: 0.47, blue: 0.98).opacity(0.7))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(0.4))
                    .textCase(.uppercase)
                    .tracking(0.3)
                Text(value)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.9))
            }
        }
    }
}

struct MiniStatItem: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.white.opacity(0.5))
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
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
        .description("View your spending and custody at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
