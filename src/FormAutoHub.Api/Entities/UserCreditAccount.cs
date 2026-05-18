namespace FormAutoHub.Api.Entities;

public sealed class UserCreditAccount
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public decimal TotalDeposited { get; set; }
    public decimal TotalUsed { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
