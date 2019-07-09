use crate::archive::*;
use std::borrow::Cow;
use std::io::Read;
use std::path::Path;
use std::*;

pub trait ArchiveIterator: Read {
    fn next(&mut self) -> io::Result<Option<()>>;
    fn path(&self) -> io::Result<Cow<Path>>;
    fn size(&self) -> io::Result<u64>;

    // XXX currently, trait upcasting is not possible. When so, remove this.
    // See https://github.com/rust-lang/rust/pull/60900
    fn as_read_mut(&mut self) -> &mut Read;
}

impl ArchiveIterator {
    pub fn step(&mut self, watchers: &mut Watchers) -> io::Result<bool> {
        // Continue only if more works has to be done
        if !watchers.is_active() {
            return Ok(false);
        }

        // Iterate over entries
        let mut did_work = false;
        while !did_work {
            // If no more entries, rewind
            if self.next()?.is_none() {
                // Clear all old watchers
                watchers.next_pass()?;

                return Ok(false);
            }

            let path = self.path()?;
            let path = path.to_path_buf(); // XXX TODO slow!

            if let Some(open) = watchers.opens.remove(&path) {
                did_work = true;

                let size = self.size()?;
                let entry = ArchiveEntry::new(path.as_path(), self.as_read_mut(), size);

                if let Some(new_w) = (open.cb)(entry)? {
                    watchers.append(new_w);
                }
            }
        }

        Ok(true)
    }
}
