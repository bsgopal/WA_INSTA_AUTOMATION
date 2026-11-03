import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  InputAdornment,
  Stack,
  TablePagination
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  CheckCircle as CheckCircleIcon,
  Calculate as CalculateIcon,
  ElectricBolt as ElectricBoltIcon,
  Search as SearchIcon,
  ReceiptLong as ReceiptIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import apiClient from '../../api/client';

export default function Wallet() {
  const [wallet, setWallet] = useState({
    walletBalance: 0,
    messageRate: 0.90,
    availableCredits: 0,
    allowWithoutBalance: false,
    lowBalanceThreshold: 200,
    totalSpent: 0,
    totalMessagesSent: 0,
    customerCode: '',
    clientName: ''
  });

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [totalTxns, setTotalTxns] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Two-way calculator state
  const [calcAmount, setCalcAmount] = useState('2000');
  const [calcMessages, setCalcMessages] = useState('2222');
  const [activeCalcMode, setActiveCalcMode] = useState('amount'); // 'amount' | 'messages'

  // Top-Up Dialog state
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Instant Transfer');

  const messageRate = Number(wallet.messageRate || 0.90);

  // Fetch live wallet stats
  const fetchWalletStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/wallet/status');
      if (res.data && res.data.success) {
        setWallet(res.data);
        const rate = Number(res.data.messageRate || 0.90);
        // Sync initial calculator to Rs 2,000
        const initialAmt = 2000;
        setCalcAmount(String(initialAmt));
        setCalcMessages(String(Math.floor(initialAmt / rate)));
      }
    } catch (err) {
      console.error('Error fetching wallet status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transactions ledger
  const fetchTransactions = useCallback(async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        type: typeFilter
      };
      const res = await apiClient.get('/wallet/transactions', { params });
      if (res.data && res.data.success) {
        setTransactions(res.data.transactions || []);
        setTotalTxns(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [page, rowsPerPage, typeFilter]);

  useEffect(() => {
    fetchWalletStatus();
  }, [fetchWalletStatus]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Two-Way calculation handlers
  const handleAmountChange = (val) => {
    setCalcAmount(val);
    setActiveCalcMode('amount');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && messageRate > 0) {
      setCalcMessages(String(Math.floor(num / messageRate)));
    } else {
      setCalcMessages('0');
    }
  };

  const handleMessagesChange = (val) => {
    setCalcMessages(val);
    setActiveCalcMode('messages');
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && messageRate > 0) {
      setCalcAmount((num * messageRate).toFixed(2));
    } else {
      setCalcAmount('0.00');
    }
  };

  const handleQuickAddMessages = (count) => {
    const current = parseInt(calcMessages, 10) || 0;
    const nextCount = current + count;
    handleMessagesChange(String(nextCount));
  };

  // Submit Top-Up
  const handleConfirmTopUp = async () => {
    const amountNum = parseFloat(calcAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTopUpError('Please enter a valid amount greater than ₹0');
      return;
    }

    try {
      setSubmittingTopUp(true);
      setTopUpError('');
      const res = await apiClient.post('/wallet/recharge', {
        amount: amountNum,
        targetMessages: parseInt(calcMessages, 10) || 0,
        paymentMethod,
        referenceNote: `Client In-App Top-up (${calcMessages} messages @ ₹${messageRate}/msg)`
      });

      if (res.data && res.data.success) {
        setTopUpSuccess(res.data.message || 'Wallet recharged successfully!');
        setTimeout(() => {
          setTopUpOpen(false);
          setTopUpSuccess('');
          fetchWalletStatus();
          fetchTransactions();
        }, 1200);
      }
    } catch (err) {
      setTopUpError(err.response?.data?.message || err.message || 'Recharge failed');
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.timestampIst && t.timestampIst.includes(q))
    );
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WalletIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>
              WhatsApp Wallet & Prepaid Credits
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your prepaid WhatsApp message balance, calculate message costs, and track all dispatches.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchWalletStatus();
              fetchTransactions();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setTopUpOpen(true)}
            sx={{ px: 3, fontWeight: 700 }}
          >
            + Add Money
          </Button>
        </Stack>
      </Box>

      {/* Super Admin Bypass Notification Banner */}
      {wallet.allowWithoutBalance && (
        <Alert
          severity="success"
          icon={<VerifiedUserIcon fontSize="inherit" />}
          sx={{ mb: 3, fontWeight: 600, borderRadius: 2 }}
        >
          Super Admin Bypass Enabled: Your account is authorized to send WhatsApp messages and campaigns with ₹0 balance. All dispatches are sponsored.
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Card 1: Balance */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Current Balance
                </Typography>
                <Chip
                  label="Available"
                  size="small"
                  color="success"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                />
              </Box>
              <Typography variant="h4" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                ₹{Number(wallet.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exact balance in tenant wallet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Messages Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Messages Remaining
                </Typography>
                <Chip
                  label={`@ ₹${messageRate.toFixed(2)}/msg`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
              <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ my: 1 }}>
                {wallet.allowWithoutBalance ? 'Unlimited' : Number(wallet.availableCredits || 0).toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {wallet.allowWithoutBalance ? 'Super Admin bypass active' : `Calculated: Balance ÷ ₹${messageRate.toFixed(2)}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Tariff Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Message Tariff
                </Typography>
                <Chip
                  label="Configured in Renic HQ"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>
                {(messageRate * 100).toFixed(0)} <Typography component="span" variant="h6" fontWeight={700}>paise</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ₹{messageRate.toFixed(2)} per outbound message
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Total Spent */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Total Dispatched
                </Typography>
                <Chip
                  label="Audit Logged"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>
                {Number(wallet.totalMessagesSent || 0).toLocaleString('en-IN')} <Typography component="span" variant="body1" color="text.secondary">msgs</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ₹{Number(wallet.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} total consumed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Two-Way Bidirectional Calculator Card */}
      <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'primary.light', boxShadow: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalculateIcon />
          <Typography variant="subtitle1" fontWeight={700}>
            Two-Way Prepaid Calculator & Target Estimator
          </Typography>
          <Chip
            label="Bidirectional"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, ml: 'auto' }}
          />
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Either enter the <b>Rupee Amount (₹)</b> to see how many messages you will get, OR enter the <b>Target Messages</b> count you wish to send to calculate the exact amount needed.
          </Typography>

          <Grid container spacing={3} alignItems="center">
            {/* Input 1: Rupee Amount */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                ENTER AMOUNT (₹)
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={calcAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  sx: { fontSize: '1.25rem', fontWeight: 700 }
                }}
                placeholder="2000"
                helperText={`At ₹${messageRate.toFixed(2)}/message`}
              />
            </Grid>

            {/* Equals Divider */}
            <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Chip
                  icon={<ElectricBoltIcon />}
                  label="EQUALS"
                  color="primary"
                  sx={{ fontWeight: 800, px: 1, py: 0.5 }}
                />
              </Box>
            </Grid>

            {/* Input 2: Message Count */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                TARGET MESSAGES COUNT
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={calcMessages}
                onChange={(e) => handleMessagesChange(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">messages</InputAdornment>,
                  sx: { fontSize: '1.25rem', fontWeight: 700 }
                }}
                placeholder="2222"
                helperText="Total WhatsApp messages deliverable"
              />
            </Grid>
          </Grid>

          {/* Quick Increment Chips */}
          <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 1 }}>
              Quick Target Presets:
            </Typography>
            {[1000, 2500, 5000, 10000, 25000].map((count) => (
              <Chip
                key={count}
                label={`+${count.toLocaleString('en-IN')} msgs`}
                variant="outlined"
                clickable
                onClick={() => handleMessagesChange(String(count))}
                sx={{ fontWeight: 600, borderColor: 'primary.main', color: 'primary.main' }}
              />
            ))}
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setTopUpOpen(true)}
                sx={{ fontWeight: 700, px: 3 }}
              >
                Recharge ₹{parseFloat(calcAmount || 0).toFixed(2)} Now
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Transaction Audit Ledger Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="action" />
            <Typography variant="h6" fontWeight={700}>
              Prepaid Audit Ledger & Consumption Log
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search TXN ID, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <Chip
              label="All"
              clickable
              color={typeFilter === 'ALL' ? 'primary' : 'default'}
              onClick={() => setTypeFilter('ALL')}
            />
            <Chip
              label="Recharges (Credits)"
              clickable
              color={typeFilter === 'RECHARGE' ? 'success' : 'default'}
              onClick={() => setTypeFilter('RECHARGE')}
            />
            <Chip
              label="Consumption (Debits)"
              clickable
              color={typeFilter === 'MESSAGE_CONSUMPTION' ? 'error' : 'default'}
              onClick={() => setTypeFilter('MESSAGE_CONSUMPTION')}
            />
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time (IST)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Messages</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Balance After</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No transactions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((row) => {
                  const isCredit = row.type === 'RECHARGE' || row.type === 'REFUND';
                  return (
                    <TableRow key={row._id || row.transactionId} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
                        {row.transactionId}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {row.timestampIst || (row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '-')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={isCredit ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                          label={row.type === 'RECHARGE' ? 'Top-Up' : row.type === 'REFUND' ? 'Refund' : 'Message Send'}
                          size="small"
                          color={isCredit ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: isCredit ? 'success.main' : 'error.main' }}>
                        {isCredit ? `+₹${Number(row.amount).toFixed(2)}` : `-₹${Number(row.amount).toFixed(2)}`}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {isCredit ? `+${row.messagesCount || 0}` : `-${row.messagesCount || 1}`}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{Number(row.balanceAfter || 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, fontSize: '0.85rem', color: 'text.secondary' }}>
                        {row.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status || 'SUCCESS'}
                          size="small"
                          color={row.status === 'SUCCESS' ? 'success' : 'default'}
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalTxns}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Add Money Confirmation Dialog */}
      <Dialog open={topUpOpen} onClose={() => !submittingTopUp && setTopUpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <WalletIcon color="primary" />
          Add Money to WhatsApp Wallet
        </DialogTitle>
        <DialogContent dividers>
          {topUpError && <Alert severity="error" sx={{ mb: 2 }}>{topUpError}</Alert>}
          {topUpSuccess && <Alert severity="success" sx={{ mb: 2 }}>{topUpSuccess}</Alert>}

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Top-Up Amount:</Typography>
              <Typography variant="h6" fontWeight={800} color="success.main">₹{parseFloat(calcAmount || 0).toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">WhatsApp Credits Credited:</Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">+{parseInt(calcMessages || 0, 10).toLocaleString('en-IN')} messages</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Applied Tariff:</Typography>
              <Typography variant="body2" fontWeight={600}>₹{messageRate.toFixed(2)} / message</Typography>
            </Box>
          </Box>

          <TextField
            select
            fullWidth
            label="Payment Mode"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="UPI / Instant Transfer">UPI / Instant Transfer (Simulated / Razorpay)</option>
            <option value="NetBanking / NEFT">NetBanking / NEFT</option>
            <option value="Corporate Credit Card">Corporate Credit Card</option>
            <option value="Manual / Cheque">Offline / Cheque Clearance</option>
          </TextField>

          <Typography variant="caption" color="text.secondary">
            Note: In local development & testing mode, the top-up will immediately credit your wallet balance and sync with Renic Soft HQ.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button disabled={submittingTopUp} onClick={() => setTopUpOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={submittingTopUp}
            onClick={handleConfirmTopUp}
            startIcon={submittingTopUp ? <CircularProgress size={18} /> : <CheckCircleIcon />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {submittingTopUp ? 'Crediting...' : `Pay & Credit ₹${parseFloat(calcAmount || 0).toFixed(2)}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
