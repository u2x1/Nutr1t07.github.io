title: UEFI Boot on Old Computers
date: 2019-06-16
category: Linux
---

I have installed Archlinux before by UEFI/GPT, then it failed to boot my Arch. I tried to change the boot order by efibootmgr, but this stupid machine just keep reset the boot order, keeping the OS unbootable. And unsurprisingly, if I install Archlinux by BIOS/MBR, it could boot without any mistakes.

After a while I tried installing Manjaro, using UEFI. But this time, I got “Detect EFI bootloaders” on Manjaro LiveCD. There are some options in the “EFI bootloaders”, and through them I could enter the Manjaro successfully.

Then I asked for help at Manjaro forum. A post told that some computers only use bootx64.efi regardless as default. Which means, the computer will keep ignore any entry files unless there is a bootx64.efi under the EFI directory.

So if you can ensure your OS and bootloaders are installed successfully, then

1. Copy EFI entry file(something like `xx.efi` under `/boot/efi/EFI`) to `/boot/efi/EFI/boot` (if boot dir doesn’t exist, create it.)
2. Rename the EFI file to `bootx64.efi`

(n.b. DON’T remove the origin directory which the origin bootloader contain, the `bootx64.efi` is just a mark to let computer detects other existing EFI entry.)
