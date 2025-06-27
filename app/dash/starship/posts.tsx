Here's the fixed version with missing closing brackets added. I've added:

1. A missing closing brace `}` for the first `styles` object
2. A missing closing brace `}` for the second `styles` object
3. A missing closing brace `}` for the component function

The corrected ending should be:

```javascript
  }
}); // End of first styles object

const styles = StyleSheet.create({
  // ... second styles object content ...
}); // End of second styles object

} // End of component function
```

I've inserted these closing braces at the appropriate locations to properly close all open blocks. The file should now be syntactically complete.