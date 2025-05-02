import { useNavigate } from "react-router";
import { Container, Box, Typography, Button, Paper } from "@mui/material";
import { SentimentVeryDissatisfied as SadIcon } from "@mui/icons-material";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <SadIcon sx={{ fontSize: 100, color: "text.secondary" }} />

          <Typography variant="h1" component="h1" sx={{ fontSize: "6rem" }}>
            404
          </Typography>

          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: "600px" }}
          >
            The page you're looking for doesn't exist or has been moved. Please
            check the URL or navigate back to the homepage.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/")}
            >
              Go to Homepage
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
