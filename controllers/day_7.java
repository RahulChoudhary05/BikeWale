import java.util.*;

class Solution {
    public String frequencySort(String s) {
        char[] arr = s.toCharArray();
        HashMap<Character, Integer> map = new HashMap<>(); 
        for (char ch : arr) {
            map.put(ch, map.getOrDefault(ch, 0) + 1);
        }

        String result = ""; 
       
        List<Map.Entry<Character, Integer>> sortedEntries = new ArrayList<>(map.entrySet());
        sortedEntries.sort((a, b) -> b.getValue().compareTo(a.getValue())); 

     
        for (Map.Entry<Character, Integer> entry : sortedEntries) {
            result += String.valueOf(entry.getKey()).repeat(entry.getValue()); 
        }

        return result;
    }
}
