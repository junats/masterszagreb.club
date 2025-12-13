import Foundation
import Capacitor
import WidgetKit

@objc(TrueTrackWidgetPlugin)
public class TrueTrackWidgetPlugin: CAPPlugin {

    override public func load() {
        print("TrueTrackWidgetPlugin: Loaded successfully!")
    }

    @objc public static func warmUp() {
        print("TrueTrackWidgetPlugin: warmUp called - Swift is linked!")
    }

    @objc func testEcho(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        let result = WidgetHelper.shared.echo(value)
        call.resolve(["value": result])
    }

    @objc func ping(_ call: CAPPluginCall) {
        call.resolve(["value": "pong"])
    }

    @objc func setWidgetData(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else {
            call.reject("No value provided")
            return
        }

        let success = WidgetHelper.shared.setWidgetData(value)

        if success {
            let path = "group.com.truetrack.app/widget_data"
            call.resolve(["success": true, "filePath": path])
        } else {
            call.reject("Failed to write to App Group")
        }
    }
}

@objc public class WidgetHelper: NSObject {
    @objc public static let shared = WidgetHelper()
    
    @objc public func echo(_ value: String) -> String {
        return value
    }
    
    @objc public func setWidgetData(_ jsonString: String) -> Bool {
        print("WidgetHelper: setWidgetData called with: \(jsonString)")
        
        guard let userDefaults = UserDefaults(suiteName: "group.com.truetrack.app") else {
            print("WidgetHelper: Could not access App Group")
            return false
        }
        
        userDefaults.set(jsonString, forKey: "widget_data")
        userDefaults.synchronize()
        
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("WidgetHelper: WidgetCenter reloadAllTimelines called")
        }
        
        return true
    }
}
