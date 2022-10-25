import React, { forwardRef, useEffect, useState } from "react";

const Input = forwardRef((props, ref) => {
  const { id, name, onBlur, onChange, placeholder, defaultValue } = props;
  
  const [value, setValue] = useState('');

  const handleChange = event => {
    setValue(event.target.value)
    onChange && onChange(event)
  }

  useEffect(() => {
    handleChange({ target: { value: defaultValue || '' }})
  }, [defaultValue])

  return (
    <input
      ref={ref}
      className="w-full py-2 pl-3 pr-10 text-left bg-white rounded shadow-md cursor-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm"
      type={props.type || "text"}
      id={id}
      name={name}
      onBlur={onBlur}
      onChange={handleChange}
      placeholder={placeholder}
      value={value}
    />
  );
});

export default Input;
