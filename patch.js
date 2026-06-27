const fs = require('fs');
const f = 'frontend/src/pages/Campaigns/Campaigns.jsx';
const c = fs.readFileSync(f, 'utf8');
const oldText =                       Pause Campaign
                    </Button>
                  )}
                </Stack>
              ) : (
                /* Edit mode action buttons */;
const newText =                       Pause Campaign
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="secondary"
                    disableElevation
                    onClick={() => {
                      setOpenManualSendDialog(true);
                      fetchManualSendCustomers();
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                  >
                    Manual Send
                  </Button>
                </Stack>
              ) : (
                /* Edit mode action buttons */;
if (c.includes(oldText)) {
  fs.writeFileSync(f, c.replace(oldText, newText));
  console.log('Button added');
} else {
  console.log('Button marker not found');
}
