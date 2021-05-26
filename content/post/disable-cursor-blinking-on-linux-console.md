title: Disable Cursor Blinking on Linux Console
date: 2020-07-04
category: Linux
---

I am not a fan of blinking cursors. The cursor, blinking endlessly, always reminds me of the shitty codes I'm writing, the ugly interface I'm facing, as well as my pitiful time wasted when I'm thinking. Anyway, I decided to turn it off.

Comparing to terminal emulator, the cursor appearance in the Linux console (which is, not to enter the desktop environment) is rather difficult to configure. There is no direct configuration file that can be modified to change its behavior. I found a [post](http://www.friendlyarm.net/forum/topic/2998) which said that there are some kernel parameters, such as vt.global\_cursor\_default, vt.cur_default, that can affect the cursor on boot, and thus the Linux console. Their descriptions as follows:

```
vt.cur_default= [VT] Default cursor shape.
                Format: 0xCCBBAA, where AA, BB, and CC are the same as
                the parameters of the <Esc>[?A;B;Cc escape sequence;
                see VGA-softcursor.txt. Default: 2 = underline.

vt.global_cursor_default=
                [VT]
                Format=<-1|0|1>
                Set system-wide default for whether a cursor
                is shown on new VTs. Default is -1,
                i.e. cursors will be created by default unless
                overridden by individual drivers. 0 will hide
                cursors, 1 will display them.
```

Settings to vt.global\_cursor\_default only determine whether cursors show or hide, while vt.cur_default , for the default cursor shape, seems to have more flexible options. But when I tried to read [VGA-softcursor.txt](https://www.kernel.org/doc/html/latest/admin-guide/vga-softcursor.html) I got sort of confused. Some many terminologies and usages were beyond my knowledge. But I'll still try my best to describe it.

#### The Escape Sequence

The cursor appearance is controlled, by the sequence `[?1;2;3c`. The first argument changes the cursor size, and the rest is for cursor color.

You can try them in Linux console by entering `echo -e '\033[?1;2;3c'`.

For example:


> To get normal blinking underline(2 for the first argument), use:
> ```
> echo -e '\033[?2c'
> ```
> To get blinking block(2 for the first argument), use:
> ```
> echo -e '\033[?6c'
> ```
> To get red non-blinking block(17 for the first argument, 0 for the second, 64 for the third), use:
> ```
> echo -e '\033[?17;0;64c'
> ```


#### The First Argument

In the first argument you specify cursor size:

```
0=default
1=invisible
2=underline,
3=lower_third
4=lower_half
5=two_thirds
6=full block
7=full block
...
15=full block

+ 16 if you want the software cursor to be applied
+ 32 if you want to always change the background color
+ 64 if you dislike having the background the same as the
     foreground.
```

The `"+16 for software cursor"` means that in the range of `0~15`, you are using a hardware cursor. The value of the second and the third argument will always be 0 and you won't be able to change the default cursor color.

In the range of 48~63(range 0~15 +16 +32), you get a cursor that background color is always the same, which is, a NON-BLINKING cursor!

And in 112~127, maybe it makes the foreground color not the same as the background one, letting the character be visible. I'm not sure about this. But anyway, it's also a NON-BLINKING cursor!

#### The Second and the Third Argument

I'm putting them together because they actually do the same thing. In the third argument you set the color sequence of 8 bits. And in the second argument you change the sequence using XOR.

On standard VGA, the high four bits and the low four bits specify the background and foreground color, respectively. The most significant bit in each four bits is for highlight (maybe blinking).

Assume that we have 0 for Argument 2, and 16 for Argument 3, so we have the two-bit sequence as follows:

```
0000 0000 -- Argument 2
0001 0000 -- Argument 3
```

XORing them, we get a bit sequence as 0001 0000. The most significant bits of both the background group and the foreground group are set to zero. So this is, as well, a NON-BLINKING cursor! Meanwhile, the background color group is 001 and the foreground one is 000. Each bit in the group stands for red, green, and blue (RGB), so through 001, we get a cursor that having its background color blue.

#### GRUB

The kernel parameter that sets the default cursor shape has a format of `0xCCBBAA`. Because it's hexadecimal, the corresponding parameter to `echo -e '\033[?17;0;32c'` is `vt.cur_default=0x200011`

We need to add them to the kernel argument field `(GRUB_CMDLINE_LINUX_DEFAULT)` in the default GRUB configuration file (at `/etc/default/grub`), and then regenerate it using `grub-mkconfig -o /boot/grub/grub.cfg`.

#### Reference

- [The kernel’s command-line parameters - The Linux Kernel](https://www.kernel.org/doc/html/v4.10/admin-guide/kernel-parameters.html)
- [Cursor Appearance in the Linux Console - Linux Gazette](https://linuxgazette.net/137/anonymous.html)

