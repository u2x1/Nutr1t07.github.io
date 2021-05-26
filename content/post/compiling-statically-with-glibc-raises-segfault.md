title: Compiling Statically With Glibc Raises Segfault at Runtime
date: 2020-03-12
category: Coding
---

I’m writing a chatting bot with Haskell and I need to statically compile my program, run it on the server which is running on `Ubuntu 18.04 bionic`. When I built my stack project with GHC option `-optl-static`, running it, I got a segfault. Checking the core dump file and I got this:

```
Stack trace of thread 26051:
#0  0x00007f5ce4cef448 n/a (/lib/x86\_64-linux-gnu/libnss\_files-2.27.so)
#1  0x00007f5ce4cf08bd \_nss\_files\_gethostbyname4\_r (/lib/x86\_64-linux-gnu/libnss\_files-2.27.so)
#2  0x0000000001a41d66 n/a (/home/nutr1t07/wl)
#3  0x0000000001a42c39 n/a (/home/nutr1t07/wl)
#4  0x0000000000ddcf91 n/a (/home/nutr1t07/wl)
```

I ran the same program on my PC, it raised a segfault as well. The core dump info was as follow:

```
Stack trace of thread 38504:
#0  0x00007f6c7165ef43 n/a (/usr/lib/libnss\_resolve.so.2 + 0x6f43)
#1  0x00007f6c7166b47e n/a (/usr/lib/libnss\_resolve.so.2 + 0x1347e)
#2  0x00007f6c7168a119 n/a (/usr/lib/libnss\_resolve.so.2 + 0x32119)
#3  0x00007f6c7168a3a5 n/a (/usr/lib/libnss\_resolve.so.2 + 0x323a5)
#4  0x00007f6c7168a976 n/a (/usr/lib/libnss\_resolve.so.2 + 0x32976)
#5  0x00007f6c7168e7e7 \_nss\_resolve\_gethostbyname4\_r (/usr/lib/libnss\_resolve.so.2 + 0x367e7)
#6  0x000000000197dd96 n/a (/home/nutr1t07/wl-bot/.stack-work/install/x86\_64-linux-tinfo6/7c9765861f2b111532edba40b3a00a85ac41e39dc6945f6238a49b1465764ba9/8.6.5/bin/wl-bot-exe + 0x157dd96)
```

#### NSS (Name Service Switch)

> 29.2.1 Services in the NSS configuration File (from [glibc manual](https://www.gnu.org/software/libc/manual/html_node/Services-in-the-NSS-configuration.html#Services-in-the-NSS-configuration)):
> 
> Assume the service name shall be used for a lookup. The code for this service is implemented in a module called libnssname. On a system supporting shared libraries this is in fact a shared library with the name (for example) libnssname.so.2.

So we can conjecture that there should be something wrong with NSS.

The [Name Service Switch (NSS)](https://en.wikipedia.org/wiki/Name_Service_Switch) is a facility that provides a variety of sources for common configuration databases and name resolution mechanisms[^1]. Here is what a part of its configuration file (`/etc/nsswitch.conf`) looks like:

```
passwd: files mymachines systemd
group: files mymachines systemd
shadow: files

publickey: files

hosts: files mymachines myhostname resolve [!UNAVAIL=return] dns
networks: files
```

Its configuration is of the pattern `database: <service>`. NSS would attempt to use the services in order of them to resolve queries on the specified database. You should check [this manual](http://man7.org/linux/man-pages/man5/nsswitch.conf.5.html) for more details.

#### glibc

`glibc` uses [dlopen](http://man7.org/linux/man-pages/man3/dlopen.3.html), which is used to load dynamic shared objects, to load NSS modules. This requires at runtime the shared libraries from the glibc version used for linking, which makes the program need a second copy of the C library. It means the statically linked program has two copies of the C library in its address space, and they might fight over whose stdout buffer is to be used, who gets to call sbrk with a nonzero argument, that sort of thing.[^2]

There is also a [FAQ page](https://sourceware.org/glibc/wiki/FAQ#Even_statically_linked_programs_need_some_shared_libraries_which_is_not_acceptable_for_me.__What_can_I_do.3F) on glibc wiki that explained why statically linked programs need shared libraries.

There must be some advantages for doing so. And the mechanism of NSS is also a feature of glibc. I have nothing to say about that.

#### Solution?

However, NSS doesn’t seem to be very necessary for me. Another libc musl which does not have NSS[^3] is likely an alternative of glibc. A docker image [ghc-musl](https://github.com/utdemir/ghc-musl) provides GHC compiled with musl, which can be easily used on stack projects.

Or use an awesome project static-haskell-nix to build static binaries with Nix.
#### Acknowledgements

- [Using GHC option '-optl-static' causes segfault - Haskell-cafe](https://mail.haskell.org/pipermail/haskell-cafe/2020-March/131981.html)

[^1]: [Name Service Switch](https://en.wikipedia.org/wiki/Name_Service_Switch)

[^2]: [Why is statically linking glibc discouraged?](https://stackoverflow.com/a/57478728/12279828)

[^3]: [Future Ideas of musl](https://wiki.musl-libc.org/future-ideas.html)

