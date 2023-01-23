import Prim "mo:prim";
import Time "mo:base/Time";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Option "mo:base/Option";
import Array "mo:base/Array";
import List "mo:base/List";

module {

    private func trimPattern(char : Char) : Bool {
        Char.equal(' ', char) or Char.equal('\r', char) or Char.equal('\n', char);
    };

    public func epochTime() : Int {
        let ms : Int = Time.now() / 1000000;
        return ms;
    };

    public func safeGet<K, V>(hashMap : HashMap.HashMap<K, V>, key : K, defaultValue : V) : V {
        switch (hashMap.get(key)) {
            case null defaultValue;
            case (?value) value;
        };
    };

    public func trim(value : Text) : Text {
        Text.trim(value, #predicate(trimPattern));
    };

    public func lowerCase(value : Text) : Text {
        Text.map(value, Prim.charToLower);
    };

    public func upperCase(value : Text) : Text {
        Text.map(value, Prim.charToUpper);
    };

    public func compareIgnoreCase(x : Text, y : Text) : Bool {
        lowerCase(x) == lowerCase(y);
    };

    //gets Nat from Text
    public func textToNat(txt : Text) : Nat {
        assert (txt.size() > 0);
        let chars = txt.chars();

        var num : Nat = 0;
        for (v in chars) {
            let charToNum = Nat32.toNat(Char.toNat32(v) -48);
            assert (charToNum >= 0 and charToNum <= 9);
            num := num * 10 + charToNum;
        };

        num;
    };

};
