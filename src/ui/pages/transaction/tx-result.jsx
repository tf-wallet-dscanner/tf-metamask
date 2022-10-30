import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from 'ui/components/atoms/box';
import Button from 'ui/components/atoms/button';
import Container from 'ui/components/atoms/container';
import Typography from 'ui/components/atoms/typography';
import { useResetUnapprovedTx } from 'ui/data/transaction';

function TxResult() {
  const { txHash } = useParams();
  const navigation = useNavigate();
  const { mutate: resetUnapprovedTx } = useResetUnapprovedTx();

  // unmount 시점
  useEffect(() => {
    return () => {
      // unApprovedTx 정보 초기화
      resetUnapprovedTx();
    };
  }, []);

  return (
    <Container>
      <Box className="mt-8 text-center">
        <Typography className="text-32">Successful</Typography>
      </Box>
      <Box className="mt-40 text-center">
        <Typography className="text-xl">
          Transaction Hash:
          <br />
          <Typography className="text-[#7d7dce] break-all">{txHash}</Typography>
        </Typography>
      </Box>
      <Box className="absolute bottom-0 w-full">
        <Button
          className="font-bold text-sm !bg-dark-blue"
          onClick={() => navigation('/home')}
        >
          Home
        </Button>
      </Box>
    </Container>
  );
}

export default TxResult;
