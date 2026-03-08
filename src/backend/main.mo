import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Leaderboard types and data
  type ScoreEntry = {
    id : Nat;
    playerName : Text;
    score : Nat;
    timestamp : Time.Time;
  };

  module ScoreEntry {
    public func compareByScore(entry1 : ScoreEntry, entry2 : ScoreEntry) : Order.Order {
      switch (Nat.compare(entry2.score, entry1.score)) {
        case (#equal) {
          Int.compare(entry2.timestamp, entry1.timestamp);
        };
        case (order) { order };
      };
    };
  };

  let entries = Map.empty<Nat, ScoreEntry>();
  var nextId = 0;

  // Leaderboard functions - public access (including guests)
  // No authorization check needed as per requirements: "Leaderboard is public"
  public shared ({ caller }) func addScore(playerName : Text, score : Nat) : async () {
    let entry : ScoreEntry = {
      id = nextId;
      playerName;
      score;
      timestamp = Time.now();
    };
    entries.add(nextId, entry);
    nextId += 1;
  };

  public query ({ caller }) func getTopScores() : async [ScoreEntry] {
    entries.values().toArray().sort(ScoreEntry.compareByScore).sliceToArray(0, 10);
  };

  public query ({ caller }) func getAllScores() : async [ScoreEntry] {
    entries.values().toArray().sort(ScoreEntry.compareByScore);
  };
};
