import UIKit
import Messages
import AVFoundation

/// iMessage app: a "Voices" tab (sends the MP4 clip so the recipient hears the scream)
/// and a "Stickers" tab (12 animated NO stickers you can tap or peel onto a bubble).
final class MessagesViewController: MSMessagesAppViewController {

    private struct Voice {
        let id: String
        let title: String
    }

    private let voices: [Voice] = [
        Voice(id: "zombie", title: "Zombie"),
        Voice(id: "demon", title: "Demon"),
        Voice(id: "banshee", title: "Banshee"),
        Voice(id: "whisper_scream", title: "Whisper…SCREAM"),
        Voice(id: "old_man", title: "Angry Old Man"),
        Voice(id: "creepy_girl", title: "Creepy Girl"),
        Voice(id: "monster_roar", title: "Monster Roar"),
        Voice(id: "opera_diva", title: "Opera Diva"),
        Voice(id: "chipmunk", title: "Chipmunk"),
        Voice(id: "god_voice", title: "Voice of God"),
        Voice(id: "robot_overlord", title: "Robot Overlord"),
        Voice(id: "goat_scream", title: "Goat"),
    ]

    private let red = UIColor(red: 0.82, green: 0.06, blue: 0.06, alpha: 1)
    private let segmented = UISegmentedControl(items: ["Voices 🔊", "Stickers"])
    private let voiceScroll = UIScrollView()
    private let stickerScroll = UIScrollView()
    private var player: AVAudioPlayer?
    private var stickers: [MSSticker] = []
    private var stickerViews: [MSStickerView] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(white: 0.08, alpha: 1)

        segmented.selectedSegmentIndex = 0
        segmented.selectedSegmentTintColor = red
        segmented.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .normal)
        segmented.addTarget(self, action: #selector(tabChanged), for: .valueChanged)
        segmented.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(segmented)

        for scroll in [voiceScroll, stickerScroll] {
            scroll.translatesAutoresizingMaskIntoConstraints = false
            scroll.alwaysBounceVertical = true
            view.addSubview(scroll)
            NSLayoutConstraint.activate([
                scroll.topAnchor.constraint(equalTo: segmented.bottomAnchor, constant: 8),
                scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                scroll.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            ])
        }
        NSLayoutConstraint.activate([
            segmented.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            segmented.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            segmented.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
        ])

        buildVoiceGrid()
        buildStickerGrid()
        tabChanged()
        try? AVAudioSession.sharedInstance().setCategory(.playback, options: [.mixWithOthers])
    }

    // MARK: - Resources

    /// Synchronized Xcode groups may flatten Resources/ subfolders, so look in both places.
    private func resourceURL(_ name: String, _ ext: String, _ folder: String) -> URL? {
        Bundle.main.url(forResource: name, withExtension: ext)
            ?? Bundle.main.url(forResource: name, withExtension: ext, subdirectory: folder)
            ?? Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "Resources/" + folder)
    }

    // MARK: - Voices

    private func makeGrid(in scroll: UIScrollView, views: [UIView], height: CGFloat) {
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 10
        stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)
        var row: UIStackView?
        for (i, v) in views.enumerated() {
            if i % 3 == 0 {
                let r = UIStackView()
                r.axis = .horizontal
                r.spacing = 10
                r.distribution = .fillEqually
                stack.addArrangedSubview(r)
                row = r
            }
            v.heightAnchor.constraint(equalToConstant: height).isActive = true
            row?.addArrangedSubview(v)
        }
        if let r = row {
            while r.arrangedSubviews.count < 3 { r.addArrangedSubview(UIView()) }
        }
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 4),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -12),
            stack.leadingAnchor.constraint(equalTo: scroll.frameLayoutGuide.leadingAnchor, constant: 12),
            stack.trailingAnchor.constraint(equalTo: scroll.frameLayoutGuide.trailingAnchor, constant: -12),
        ])
    }

    private func buildVoiceGrid() {
        let buttons: [UIView] = voices.enumerated().map { index, voice in
            let b = UIButton(type: .system)
            b.tag = index
            b.backgroundColor = red
            b.layer.cornerRadius = 16
            b.layer.borderWidth = 3
            b.layer.borderColor = UIColor(red: 0.45, green: 0, blue: 0, alpha: 1).cgColor
            b.titleLabel?.numberOfLines = 2
            b.titleLabel?.textAlignment = .center
            b.titleLabel?.font = .systemFont(ofSize: 15, weight: .heavy)
            b.setTitleColor(.white, for: .normal)
            b.setTitle("NO\n" + voice.title, for: .normal)
            b.addTarget(self, action: #selector(voiceTapped(_:)), for: .touchUpInside)
            return b
        }
        makeGrid(in: voiceScroll, views: buttons, height: 76)
    }

    @objc private func voiceTapped(_ sender: UIButton) {
        let voice = voices[sender.tag]
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        UIView.animate(withDuration: 0.08, animations: {
            sender.transform = CGAffineTransform(scaleX: 0.88, y: 0.88)
        }, completion: { _ in
            UIView.animate(withDuration: 0.25, delay: 0, usingSpringWithDamping: 0.35,
                           initialSpringVelocity: 6, options: [], animations: { sender.transform = .identity })
        })
        guard let clip = resourceURL(voice.id, "mp4", "clips") else { return }
        // Preview locally, then drop the video into the compose field; the user taps send.
        if let audio = resourceURL(voice.id, "mp3", "sounds") {
            player = try? AVAudioPlayer(contentsOf: audio)
            player?.play()
        }
        activeConversation?.insertAttachment(clip, withAlternateFilename: "NO-\(voice.id).mp4") { error in
            if let error = error { NSLog("NO Button: insertAttachment failed: \(error)") }
        }
    }

    // MARK: - Stickers

    private func buildStickerGrid() {
        let views: [UIView] = voices.compactMap { voice in
            guard let url = resourceURL(voice.id, "png", "stickers"),
                  let sticker = try? MSSticker(contentsOfFileURL: url, localizedDescription: "\(voice.title) NO")
            else { return nil }
            stickers.append(sticker)
            let v = MSStickerView(frame: .zero, sticker: sticker)
            v.startAnimating()
            stickerViews.append(v)
            return v
        }
        makeGrid(in: stickerScroll, views: views, height: 110)
    }

    @objc private func tabChanged() {
        let voicesTab = segmented.selectedSegmentIndex == 0
        voiceScroll.isHidden = !voicesTab
        stickerScroll.isHidden = voicesTab
    }

    override func willBecomeActive(with conversation: MSConversation) {
        super.willBecomeActive(with: conversation)
        stickerViews.forEach { $0.startAnimating() }
    }
}
