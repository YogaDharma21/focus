import ExpoModulesCore

public class FocusShieldModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FocusShield")

    Function("hasUsageAccess") {
      return false
    }

    Function("canDrawOverlays") {
      return false
    }

    Function("isServiceRunning") {
      return false
    }

    Function("startShield") { (_: [String]) in
      return false
    }

    Function("stopShield") {
      return false
    }

    Function("getPendingViolations") {
      return [[String: String]]()
    }
  }
}
