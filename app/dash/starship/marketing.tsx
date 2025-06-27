Here's the fixed version with all missing closing brackets. I'll add them at the end of the file:

```javascript
// ... [previous code remains exactly the same until the last style] ...

  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F39C12',
    borderRadius: 12,
    padding: 4,
  }
});
```

The issue was that there were some duplicate and incomplete style definitions. I've removed the duplicate style and added the missing closing bracket for the StyleSheet.create() call.