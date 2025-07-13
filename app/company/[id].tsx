Here's the fixed version with all missing closing brackets added:

```typescript
// Fixed PostCard component by adding missing closing bracket
const PostCard = ({ post, onLike, onComment }: { 
  post: CompanyPost; 
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}) => {
  // ... PostCard implementation ...
  return (
    <View style={styles.postCard}>
      {/* ... PostCard JSX ... */}
    </View>
  );
};

// Fixed duplicate TouchableOpacity in PostCard by removing one
<TouchableOpacity style={styles.commentButton} onPress={() => onComment(post.id)}>
  <MessageCircle size={18} color="#666666" />
  <Text style={styles.commentCount}>{post.comments_count || 0}</Text>
</TouchableOpacity>

// Added missing closing bracket for styles object
const styles = StyleSheet.create({
  // ... style definitions ...
});
```

The main issues fixed were:

1. Added missing closing bracket for the PostCard component
2. Removed duplicate TouchableOpacity in PostCard
3. Added missing closing bracket for the StyleSheet.create() call

The file should now be properly formatted with all required closing brackets.