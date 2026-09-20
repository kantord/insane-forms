The unit a schema node renders to. Build renderers on top of this rather than on Input directly.

```jsx
const TextField = z.string().meta({
  component: ({ value, onChange, label }) => <Field label={label} value={value} onChange={onChange} />,
});
```
