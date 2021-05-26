title: Differences between writeValue() and writeLong()
date: 2020-08-21
category: Coding
---

#### Cause

This is kind of ... confusing. When I was using Quick Fix to generate the methods of `Parcelable` interface for my own `Event` data class below, it filled the initializer of the nullable `Long?` with `parcel.readValue(Long::class.java.classLoader) as? Long`.

```
data class Event(
    @PrimaryKey(autoGenerate = true) val id: Long?,
) : Parcelable {
    constructor(parcel: Parcel) : this(
        parcel.readValue(Long::class.java.classLoader) as? Long,
    )
    override fun writeToParcel(parcel: Parcel, flags: Int) {
        parcel.writeValue(id)
}
```

But I didn't know what did that mean. I thought calling `writeLong` could also run. So I just replaced the it with `writeLong(id ?: 999)` in `writeToParcel()` method.

```
override fun writeToParcel(parcel: Parcel, flags: Int) {
    parcel.writeLong(id ?: 999)
}
```

When I passed an `Event` object to another activity through Intent and accessing it using `intent.extras?.get()`, two exceptions raised. One is `ClassNotFoundException` as it tried to read a Long value through `readValue(Long::class.java.classLoader)` from `Parcelable`, another one is the TypeCastException as I wanted to cast the parcelable to my own class Event.

#### Differences

So what is the difference between `writeLong()` and `writeValue()`, as well as `readValue()` and `readLong()`? If you check the source code of `writeValue()`, you will see that `writeValue()` is only a wrapper of `writeXX()`. Calling `writeValue()` to write a Long value, will first write an integer `VAL_LONG` to parcel by `writeInt()` to represent its value type, followed by the real Long value writing by `writeLong()`.

```
public final void writeValue(Object v) {
    if (v == null) {
        writeInt(VAL_NULL);
    } else if (v instanceof String) {
        writeInt(VAL_STRING);
        writeString((String) v);
    // ...
    } else if (v instanceof Long) {
        writeInt(VAL_LONG);
        writeLong((Long) v);
    }
    // ...
}

public final Object readValue(ClassLoader loader) {
    int type = readInt();

    switch (type) {
    case VAL_NULL:
        return null;

    // ...

    case VAL_LONG:
        return readLong();

    // ...
    default:
        int off = dataPosition() - 4;
        throw new RuntimeException(
            "Parcel " + this + ": Unmarshalling unknown type code " +
              type + " at offset " + off);
    }
}
```

For that reason, calling `writeLong()` to write a `Long` value while using `readValue()` to read that `Long`, will end up regarding the actual Long value we wrote as the value type, and performing the corresponding `readXX()` function.

#### Reference

- [Stack Overflow - How to serialize null value when using Parcelable interface](https://stackoverflow.com/questions/5905105/how-to-serialize-null-value-when-using-parcelable-interface/10769887#10769887)

