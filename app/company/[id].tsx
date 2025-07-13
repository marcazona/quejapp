Here's the fixed version with the missing closing brackets and corrected syntax:

1. Fixed the `Heart` component in the company info row by replacing the incorrect `</Text>` with `/>`:

```javascript
<Heart 
  size={22} 
  color={isFollowing ? "#E74C3C" : "#FFFFFF"} 
  fill={isFollowing ? "#E74C3C" : "transparent"} 
/>
```

2. Added missing closing curly brace for the `companyInfoRow` object in the styles:

```javascript
companyInfoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 4,
},
```

The rest of the file appears to be properly structured with matching brackets. These were the only syntax errors I found in the provided code.