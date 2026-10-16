@_exported import Foundation
open class AVAudioPlayer { public init(contentsOf u: URL) throws {}; @discardableResult public func play() -> Bool { true } }
open class AVAudioSession { public static func sharedInstance() -> AVAudioSession { AVAudioSession() }
  public enum Category { case playback }; public struct CategoryOptions: OptionSet { public let rawValue: Int; public init(rawValue: Int) { self.rawValue = rawValue }; public static let mixWithOthers = CategoryOptions(rawValue: 1) }
  public func setCategory(_ c: Category, options: CategoryOptions = []) throws {} }
